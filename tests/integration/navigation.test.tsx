import { act, renderApp, screen, fireEvent } from "@tests/helpers/render";
import { hasHeaderEntrance } from "@tests/helpers/header-entrance";

import { BUILD_STAGE_MS, MOCK_TEST_LINKS } from "@/core/plan-builder";
import { SAMPLE_PLAN_ID } from "@/core/mock-data";

// Welcome stays mounted under every other screen, and its intro story would
// keep ticking through the fake timers these flows advance. Reduce Motion
// holds it still, as it does for people who turn it on.
jest.mock("@/core/accessibility/use-reduce-motion", () => ({ useReduceMotion: () => true }));

/**
 * Welcome's Get a plan now — which moves on a frame later, once its spinner's
 * drawn. `renderApp` (Expo Router's `renderRouter`) runs on fake timers, so the
 * frame is advanced here.
 */
function getAPlanNow() {
  fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
  act(() => {
    jest.advanceTimersByTime(32);
  });
}

/** Welcome -> Home -> the tab bar's + -> New Plan. */
async function openNewPlan() {
  const view = renderApp();
  getAPlanNow();
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
    getAPlanNow();

    // Pushed onto Home's stack (not the Plans tab's), so iOS's zoom
    // transition can run from the card.
    fireEvent.press(screen.getByTestId("home-tab-active-plan"));
    expect(view.getPathname()).toBe("/home/plan-today-i-choose-to-be-a-blessing");
    expect(screen.getByTestId("plan-overview-title")).toHaveTextContent(
      "Today I Choose to Be a Blessing",
    );

    fireEvent.press(screen.getByTestId("plan-overview-back-button"));
    expect(view.getPathname()).toBe("/home");

    fireEvent.press(screen.getByTestId("home-tab-active-plan"));
    expect(view.getPathname()).toBe("/home/plan-today-i-choose-to-be-a-blessing");
  });

  it("walks Welcome -> Plan Overview for the sample plan", () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));

    expect(view.getPathname()).toBe(`/plans/${SAMPLE_PLAN_ID}`);
    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();
  });

  it("walks Plan Overview -> Read -> Scripture -> Reflect -> Pray -> Day Complete for a mocked plan", async () => {
    const view = renderApp();

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));
    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();

    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(view.getPathname()).toBe(`/study/${SAMPLE_PLAN_ID}`);
    expect(screen.getByTestId("study-read-body")).toBeVisible();

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-reflect-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-pray-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    expect(view.getPathname()).toBe(`/study/${SAMPLE_PLAN_ID}/day-complete`);
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

    // Done.
    fireEvent.press(screen.getByTestId("day-complete-done-button"));

    expect(screen.getByTestId("plan-overview-day-1")).toHaveAccessibleName(/^Day 1, done/);
    expect(screen.getByTestId("plan-overview-day-2")).not.toHaveAccessibleName(/locked/);
    expect(screen.getByTestId("plan-overview-continue-button")).toHaveTextContent("Continue Day 2");
  });

  it(
    "opens a day's Quick Check on Finish, takes it to Done, lands on Day Complete, and Done! returns to the overview",
    async () => {
      const view = renderApp();
      const TEMPTATION = "plan-overcome-temptation";
      getAPlanNow();
      fireEvent.press(screen.getByTestId("tab-plans"));
      fireEvent.press(screen.getByTestId(`plans-item-${TEMPTATION}`));
      fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
      for (const next of ["scripture", "reflect", "pray"]) {
        fireEvent.press(screen.getByTestId("study-nav-next-button"));
        await screen.findByTestId(`study-${next}-body`);
      }
      fireEvent.press(screen.getByTestId("study-nav-next-button"));
      // Finish opens the Quick Check, not Day Complete.
      expect(view.getPathname()).toBe(`/study/${TEMPTATION}/quick-check`);
      expect(screen.queryByTestId("day-complete-screen")).toBeNull();
      expect(screen.getByTestId("quick-check-intro")).toBeVisible();
      fireEvent.press(screen.getByTestId("quick-check-start-button"));

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
      expect(view.getPathname()).toBe(`/study/${TEMPTATION}/quick-check`);

      fireEvent.press(screen.getByTestId("quick-check-done-button"));
      expect(view.getPathname()).toBe(`/study/${TEMPTATION}/day-complete`);
      expect(screen.getByTestId("day-complete-screen")).toBeVisible();

      fireEvent.press(screen.getByTestId("day-complete-done-button"));
      expect(view.getPathname()).toBe(`/plans/${TEMPTATION}`);
    },
    // A long walk — Plans, a whole study day, and a whole Quick Check.
    BUILD_FLOW_TIMEOUT_MS,
  );

  it("sets the tabs as Home, Plans, Progress, then Settings — Fun hidden for now", () => {
    renderApp();
    getAPlanNow();

    expect(
      screen
        .getAllByTestId(/^tab-(home|plans|fun|progress|settings)$/)
        .map((tab) => String(tab.props.testID)),
    ).toEqual(["tab-home", "tab-plans", "tab-progress", "tab-settings"]);
  });

  it("carries no account icon in a tab's header, now Settings is a tab", () => {
    renderApp();
    getAPlanNow();

    expect(screen.queryByTestId("home-tab-account-button")).toBeNull();
    fireEvent.press(screen.getByTestId("tab-plans"));
    expect(screen.queryByTestId("plans-account-button")).toBeNull();
    fireEvent.press(screen.getByTestId("tab-progress"));
    expect(screen.queryByTestId("progress-account-button")).toBeNull();
  });

  it("round-trips a Settings subpage back to Settings, from its tab", () => {
    const view = renderApp();

    getAPlanNow();
    fireEvent.press(screen.getByTestId("tab-settings"));
    expect(view.getPathname()).toBe("/settings");

    fireEvent.press(screen.getByTestId("settings-daily-reminder-row"));
    expect(view.getPathname()).toBe("/settings/daily-reminder");

    fireEvent.press(screen.getByTestId("daily-reminder-back-button"));
    expect(view.getPathname()).toBe("/settings");
  });

  describe("header icons arriving", () => {
    it("animates Plan Detail's header buttons as it's pushed", () => {
      renderApp();
      getAPlanNow();

      fireEvent.press(screen.getByTestId("home-tab-active-plan"));

      expect(hasHeaderEntrance("plan-overview-back-button")).toBe(true);
    });
  });
});
