import { act, renderApp, screen, fireEvent } from "@tests/helpers/render";
import { hasHeaderEntrance } from "@tests/helpers/header-entrance";

import { BUILD_STAGE_MS, MOCK_TEST_LINKS } from "@/core/plan-builder";

// Welcome stays mounted under every other screen, and its intro story would
// keep ticking through the fake timers these flows advance. Reduce Motion
// holds it still, as it does for people who turn it on.
jest.mock("@/core/accessibility/use-reduce-motion", () => ({ useReduceMotion: () => true }));

/** Welcome -> Home -> the tab bar's + -> New Plan. */
async function openNewPlan() {
  const view = renderApp();
  fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
  expect(view.getPathname()).toBe("/home");
  fireEvent.press(screen.getByTestId("tab-bar-fab"));
  expect(view.getPathname()).toBe("/paste-sermon");
  await screen.findByTestId("paste-sermon-body");
  return view;
}

/** Pastes `link`, continues, and creates the plan with the default length. */
async function createPlanFrom(link: string) {
  fireEvent.changeText(screen.getByTestId("paste-sermon-link-input"), link);
  fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));
  // New Plan's two steps change in place — the route stays put.
  fireEvent.press(await screen.findByTestId("link-preview-create-plan-button"));
}

/**
 * Lets the frontend plan builder run: one stage at a time, since each
 * stage's timer is set once the last has landed. Covers the mock data's own
 * build finishing first, if it's still going.
 */
async function waitForBuild() {
  for (let stage = 0; stage < 14; stage += 1) {
    await act(async () => {
      jest.advanceTimersByTime(BUILD_STAGE_MS);
      await Promise.resolve();
    });
  }
}

/**
 * Proves the route tree actually wires together end to end — not just that
 * each screen renders in isolation (every screen already has its own test
 * for that), but that pressing a real button on one screen lands on the
 * next real screen, repeatedly, through a full flow.
 *
 * Every scenario starts at `/` and navigates in-app via real button presses
 * rather than `renderRouter`'s `initialUrl` option: `initialUrl` is treated
 * as an inbound deep link and passes through
 * `src/app/+native-intent.tsx` -> `validateDeepLink`, whose allowlist is
 * deliberately just `/` and `/index` (see
 * `src/core/security/deep-links/validate-deep-link.ts`) — a security
 * decision about what can be reached from *outside* the app, left
 * untouched here. In-app `router.push()` navigation is not gated by it.
 */
/** The build flows run the plan builder stage by stage; the first also warms up the app. */
const BUILD_FLOW_TIMEOUT_MS = 20_000;

describe("navigation", () => {
  it(
    "walks Welcome -> Home tab -> Paste Sermon -> Link Preview -> Preparing -> Plan Ready",
    async () => {
      const view = await openNewPlan();

      await createPlanFrom("https://youtube.com/watch?v=Qm81xRz4");
      expect(view.getPathname()).toBe("/preparing");
      expect(screen.getByText("Preparing your plan")).toBeVisible();

      await waitForBuild();

      expect(view.getPathname()).toBe("/ready");
      expect(screen.getByText("6 days from Today I Choose to Be a Blessing")).toBeVisible();
      expect(screen.getByTestId("plan-ready-start-button")).toBeVisible();

      // "Start day 1" -> Read is covered by PlanReadyScreen.test.tsx, with a
      // mocked router: it awaits the stubbed notification-permission request
      // before navigating, and that pending promise does not resolve reliably
      // under renderApp()'s forced fake timers in this harness. This test's
      // job is proving the route chain up to Plan Ready wires together: the
      // async branch past it is exercised at the unit level instead.
    },
    BUILD_FLOW_TIMEOUT_MS,
  );

  it(
    "brings a video with no captions back to New Plan, then lets another link be tried",
    async () => {
      const view = await openNewPlan();

      await createPlanFrom(MOCK_TEST_LINKS.noCaptions);
      await waitForBuild();

      expect(view.getPathname()).toBe("/paste-sermon");
      fireEvent.press(await screen.findByTestId("captions-sheet-try-another-link-button"));

      expect(await screen.findByTestId("paste-sermon-body")).toBeVisible();
      expect(screen.getByTestId("paste-sermon-link-input")).toHaveDisplayValue("");
    },
    BUILD_FLOW_TIMEOUT_MS,
  );

  it(
    "shows a failed build, and builds it again on Try again",
    async () => {
      const view = await openNewPlan();

      await createPlanFrom(MOCK_TEST_LINKS.failsOnce);
      await waitForBuild();

      expect(view.getPathname()).toBe("/preparing");
      expect(screen.getByText("We couldn't finish your plan")).toBeVisible();
      fireEvent.press(screen.getByTestId("preparing-plan-retry-button"));
      await waitForBuild();

      expect(view.getPathname()).toBe("/ready");
    },
    BUILD_FLOW_TIMEOUT_MS,
  );

  it("opens Plan Detail from Home's plan card within Home's own stack, and back again", () => {
    const view = renderApp();
    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

    // Pushed onto Home's stack (not the Plans tab's), so iOS's zoom
    // transition can run from the card.
    fireEvent.press(screen.getByTestId("home-tab-active-plan"));
    expect(view.getPathname()).toBe("/home/plan-choose-whom-you-will-serve");
    expect(screen.getByTestId("plan-overview-title")).toHaveTextContent(
      "Today I Choose to Be a Blessing",
    );

    fireEvent.press(screen.getByTestId("plan-overview-back-button"));
    expect(view.getPathname()).toBe("/home");

    fireEvent.press(screen.getByTestId("home-tab-active-plan"));
    expect(view.getPathname()).toBe("/home/plan-choose-whom-you-will-serve");
  });

  it("walks Welcome -> Plan Overview for the sample plan", () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));

    expect(view.getPathname()).toBe("/plans/sample-plan");
    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();
  });

  it("walks Plan Overview -> Read -> Scripture -> Reflect -> Pray -> Day Complete for a mocked plan", async () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));
    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();

    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(view.getPathname()).toBe("/study/sample-plan");
    expect(screen.getByTestId("study-read-body")).toBeVisible();

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-reflect-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-pray-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    expect(view.getPathname()).toBe("/study/sample-plan/day-complete");
    expect(screen.getByTestId("day-complete-screen")).toBeVisible();
  });

  it("works through a whole day to its completion, and Plan Detail shows it done and the next day open", async () => {
    renderApp();
    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));

    // Read, Scripture, Reflect, and Pray — all day 1's.
    expect(screen.getByText("Day 1 of 5")).toBeVisible();
    expect(screen.getByText("Not left")).toBeVisible();
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");
    expect(screen.getByText("Deuteronomy 31:6")).toBeVisible();
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-reflect-body");
    fireEvent.changeText(screen.getByTestId("study-reflect-answer-1"), "Since the move.");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-pray-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    expect(screen.getByTestId("day-complete-screen")).toBeVisible();

    // On to day 2, then out to the plan.
    fireEvent.press(screen.getByTestId("day-complete-next-day-button"));
    expect(screen.getByText("Day 2 of 5")).toBeVisible();
    fireEvent.press(screen.getByTestId("study-close-button"));

    expect(screen.getByTestId("plan-overview-day-1")).toHaveTextContent(/Done/);
    expect(screen.getByTestId("plan-overview-day-2")).not.toHaveTextContent(/Locked/);
    expect(screen.getByTestId("plan-overview-continue-button")).toHaveTextContent("Continue Day 2");
  });

  it(
    "takes a day's Quick Check after finishing it, scores it, and returns to Day Complete",
    async () => {
      const view = renderApp();
      const REST = "plan-come-to-me-and-rest";
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
      fireEvent.press(screen.getByTestId("tab-plans"));
      fireEvent.press(screen.getByTestId(`plans-item-${REST}`));
      fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
      for (const next of ["scripture", "reflect", "pray"]) {
        fireEvent.press(screen.getByTestId("study-nav-next-button"));
        await screen.findByTestId(`study-${next}-body`);
      }
      fireEvent.press(screen.getByTestId("study-nav-next-button"));
      expect(screen.getByTestId("day-complete-screen")).toBeVisible();

      fireEvent.press(screen.getByTestId("day-complete-quick-check-button"));
      expect(view.getPathname()).toBe(`/study/${REST}/quick-check`);

      // One question right, one wrong — all in place; the route never changes.
      fireEvent.press(screen.getByTestId("quick-check-choice-b"));
      fireEvent.press(screen.getByTestId("quick-check-check-button"));
      expect(await screen.findByText("That's the one")).toBeVisible();
      fireEvent.press(screen.getByTestId("quick-check-next-button"));
      await screen.findByText("According to the sermon, what is a yoke?");
      fireEvent.press(screen.getByTestId("quick-check-choice-a"));
      fireEvent.press(screen.getByTestId("quick-check-check-button"));
      expect(await screen.findByText("Not quite")).toBeVisible();
      fireEvent.press(screen.getByTestId("quick-check-finish-button"));
      await screen.findByTestId("quick-check-score");
      expect(screen.getByText("1/2")).toBeVisible();
      expect(view.getPathname()).toBe(`/study/${REST}/quick-check`);

      fireEvent.press(screen.getByTestId("quick-check-done-button"));
      expect(view.getPathname()).toBe(`/study/${REST}/day-complete`);
    },
    // A long walk — Plans, a whole study day, and a whole Quick Check.
    BUILD_FLOW_TIMEOUT_MS,
  );

  it("round-trips a Settings subpage back to Settings", () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
    fireEvent.press(screen.getByTestId("home-tab-account-button"));
    expect(view.getPathname()).toBe("/settings");

    fireEvent.press(screen.getByTestId("settings-daily-reminder-row"));
    expect(view.getPathname()).toBe("/settings/daily-reminder");

    fireEvent.press(screen.getByTestId("daily-reminder-back-button"));
    expect(view.getPathname()).toBe("/settings");
  });

  describe("header icons arriving", () => {
    const TABS = [
      ["tab-home", "home-tab-account-button"],
      ["tab-plans", "plans-account-button"],
      ["tab-fun", "fun-account-button"],
      ["tab-progress", "progress-account-button"],
    ] as const;

    it("never animates a tab root's header icon going between tab roots, first visits included", () => {
      renderApp();
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

      for (const [tab, button] of [...TABS.slice(1), ...TABS]) {
        fireEvent.press(screen.getByTestId(tab));
        expect(hasHeaderEntrance(button)).toBe(false);
      }
    });

    it("animates Home's header icon arriving from Welcome", () => {
      renderApp();

      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

      expect(hasHeaderEntrance("home-tab-account-button")).toBe(true);
    });

    it("animates Home's header icon coming back from Plan Detail", () => {
      renderApp();
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

      fireEvent.press(screen.getByTestId("home-tab-active-plan"));
      fireEvent.press(screen.getByTestId("plan-overview-back-button"));

      expect(hasHeaderEntrance("home-tab-account-button")).toBe(true);
    });

    it("animates Plan Detail's header buttons as it's pushed", () => {
      renderApp();
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

      fireEvent.press(screen.getByTestId("home-tab-active-plan"));

      expect(hasHeaderEntrance("plan-overview-back-button")).toBe(true);
    });

    it("animates Home's header icon coming back from Settings", () => {
      renderApp();
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

      fireEvent.press(screen.getByTestId("home-tab-account-button"));
      fireEvent.press(screen.getByTestId("tab-home"));

      expect(hasHeaderEntrance("home-tab-account-button")).toBe(true);
    });

    it("animates another tab root's header icon going to it from Settings", () => {
      renderApp();
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
      fireEvent.press(screen.getByTestId("tab-fun"));
      fireEvent.press(screen.getByTestId("tab-home"));

      fireEvent.press(screen.getByTestId("home-tab-account-button"));
      fireEvent.press(screen.getByTestId("tab-fun"));

      expect(hasHeaderEntrance("fun-account-button")).toBe(true);
    });

    it("animates a tab root's header icon arriving from a screen in another tab's stack", () => {
      renderApp();
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

      fireEvent.press(screen.getByTestId("home-tab-active-plan"));
      fireEvent.press(screen.getByTestId("tab-plans"));

      expect(hasHeaderEntrance("plans-account-button")).toBe(true);
    });
  });
});
