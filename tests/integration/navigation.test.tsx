import { renderApp, screen, fireEvent } from "@tests/helpers/render";
import { hasHeaderEntrance } from "@tests/helpers/header-entrance";

import { aPlan } from "@tests/factories/api-plans";
import { serveProgress } from "@tests/factories/api-progress";
import { servePlans } from "@tests/mocks/plans-api";
import type { ApiPlanDetail } from "@/core/api/contracts";

// Welcome stays mounted under every other screen, and its intro story would
// keep ticking through the fake timers these flows advance. Reduce Motion
// holds it still, as it does for people who turn it on.
jest.mock("@/core/accessibility/use-reduce-motion", () => ({ useReduceMotion: () => true }));

// Reflection answers live on the device only; the Daily Study reads them there.
jest.mock("@/core/storage/reflection-answers", () =>
  jest.requireActual<object>("@tests/mocks/reflection-answers"),
);

/** Under way: six days, day 1 done, day 2 today. */
const ACTIVE = aPlan({
  seed: 1,
  title: "Today I Choose to Be a Blessing",
  lengthDays: 6,
  completedDays: 1,
});
/** Three days, none done, made without Quick Checks. */
const NO_QUIZ = aPlan({
  seed: 2,
  title: "Still Praying",
  completedDays: 0,
  quickCheckEnabled: false,
});
/** One day, not done, with its Quick Check. */
const TEMPTATION = aPlan({
  seed: 3,
  title: "Overcome Temptation",
  lengthDays: 1,
  completedDays: 0,
});

/**
 * Proves the route tree actually wires together end to end — not just that
 * each screen renders in isolation (every screen already has its own test
 * for that), but that pressing a real button on one screen lands on the
 * next real screen, repeatedly, through a full flow.
 *
 * Every scenario starts at `/` — a returning reader, already onboarded, so
 * the app opens on Home — and navigates in-app via real button presses
 * rather than `renderRouter`'s `initialUrl` option: `initialUrl` is treated
 * as an inbound deep link and passes through
 * `src/app/+native-intent.tsx` -> `validateDeepLink`, whose allowlist is
 * deliberately just `/` and `/index` (see
 * `src/core/security/deep-links/validate-deep-link.ts`) — a security
 * decision about what can be reached from *outside* the app, left
 * untouched here. In-app `router.push()` navigation is not gated by it.
 */
async function openApp(plans: readonly ApiPlanDetail[] = [ACTIVE, NO_QUIZ, TEMPTATION]) {
  servePlans(plans);
  serveProgress();
  const view = renderApp();
  await screen.findByTestId("home-tab-screen");
  return view;
}

/** Opens a plan's overview from the Plans tab. */
async function openFromPlans(plan: ApiPlanDetail) {
  fireEvent.press(screen.getByTestId("tab-plans"));
  fireEvent.press(await screen.findByTestId(`plans-item-${plan.id}`));
  await screen.findByTestId("plan-overview-continue-button");
}

/** Read, Scripture, two Reflect questions, then Pray — and Finish. */
async function studyTheDay() {
  await screen.findByTestId("study-read-body");
  for (const next of ["scripture", "reflect", "reflect", "pray"]) {
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId(`study-${next}-body`);
  }
  fireEvent.press(screen.getByTestId("study-nav-next-button"));
}

/** The long walks run on fake timers, through the whole route tree. */
const LONG_FLOW_TIMEOUT_MS = 20_000;

describe("navigation", () => {
  it(
    "opens Plan Detail from Home's plan card within Home's own stack; its back goes to Plans",
    async () => {
      const view = await openApp();

      // Pushed onto Home's stack (not the Plans tab's), so iOS's zoom
      // transition can run from the card.
      fireEvent.press(await screen.findByTestId("home-tab-active-plan"));
      expect(view.getPathname()).toBe(`/home/${ACTIVE.id}`);
      expect(await screen.findByTestId("plan-overview-title")).toHaveTextContent(ACTIVE.title);

      // Not a history back: Plan Detail's back always lands on the Plans tab.
      fireEvent.press(screen.getByTestId("plan-overview-back-button"));
      expect(view.getPathname()).toBe("/plans");
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "walks Plan Overview -> Read -> Scripture -> Reflect -> Pray -> Day Complete, and Done! back to the overview",
    async () => {
      const view = await openApp();
      await openFromPlans(NO_QUIZ);

      fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
      expect(await screen.findByText("Day 1 of 3")).toBeVisible();
      await studyTheDay();

      expect(await screen.findByTestId("day-complete-screen")).toBeVisible();
      expect(view.getPathname()).toBe(`/study/${NO_QUIZ.id}/day-complete`);

      fireEvent.press(await screen.findByTestId("day-complete-done-button"));
      expect(view.getPathname()).toBe(`/plans/${NO_QUIZ.id}`);
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "opens a day's Quick Check on Finish, takes it to Done, lands on Day Complete, and Done! returns to the overview",
    async () => {
      const view = await openApp();
      await openFromPlans(TEMPTATION);
      fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
      await studyTheDay();

      // Finish opens the Quick Check, not Day Complete.
      expect(await screen.findByTestId("quick-check-intro")).toBeVisible();
      expect(view.getPathname()).toBe(`/study/${TEMPTATION.id}/quick-check`);
      expect(screen.queryByTestId("day-complete-screen")).toBeNull();
      fireEvent.press(screen.getByTestId("quick-check-start-button"));

      // Right, wrong, right — all in place; the route never changes. A tap is the answer.
      fireEvent.press(await screen.findByTestId("quick-check-choice-a"));
      expect(await screen.findByText("That's the one")).toBeVisible();
      fireEvent.press(screen.getByTestId("quick-check-next-button"));
      await screen.findByText("Question 2?");
      fireEvent.press(screen.getByTestId("quick-check-choice-b"));
      expect(await screen.findByText("Not quite")).toBeVisible();
      fireEvent.press(screen.getByTestId("quick-check-next-button"));
      await screen.findByText("Question 3?");
      fireEvent.press(screen.getByTestId("quick-check-choice-a"));
      await screen.findByTestId("quick-check-feedback");
      fireEvent.press(screen.getByTestId("quick-check-finish-button"));
      await screen.findByTestId("quick-check-results");
      expect(screen.getByText("2/3")).toBeVisible();
      expect(view.getPathname()).toBe(`/study/${TEMPTATION.id}/quick-check`);

      fireEvent.press(screen.getByTestId("quick-check-done-button"));
      expect(await screen.findByTestId("day-complete-screen")).toBeVisible();
      expect(view.getPathname()).toBe(`/study/${TEMPTATION.id}/day-complete`);
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "sets the tabs as Home, Plans, Progress, then Settings — Fun hidden for now",
    async () => {
      await openApp();

      expect(
        screen
          .getAllByTestId(/^tab-(home|plans|fun|progress|settings)$/)
          .map((tab) => String(tab.props.testID)),
      ).toEqual(["tab-home", "tab-plans", "tab-progress", "tab-settings"]);
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "carries no account icon in a tab's header, now Settings is a tab",
    async () => {
      await openApp();

      expect(screen.queryByTestId("home-tab-account-button")).toBeNull();
      fireEvent.press(screen.getByTestId("tab-plans"));
      expect(screen.queryByTestId("plans-account-button")).toBeNull();
      fireEvent.press(screen.getByTestId("tab-progress"));
      expect(screen.queryByTestId("progress-account-button")).toBeNull();
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "round-trips a Settings subpage back to Settings, from its tab",
    async () => {
      const view = await openApp();

      fireEvent.press(screen.getByTestId("tab-settings"));
      expect(view.getPathname()).toBe("/settings");

      fireEvent.press(await screen.findByTestId("settings-daily-reminder-row"));
      expect(view.getPathname()).toBe("/settings/daily-reminder");

      fireEvent.press(await screen.findByTestId("daily-reminder-back-button"));
      expect(view.getPathname()).toBe("/settings");
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  describe("header icons arriving", () => {
    it(
      "animates Plan Detail's header buttons as it's pushed",
      async () => {
        await openApp();

        fireEvent.press(await screen.findByTestId("home-tab-active-plan"));
        await screen.findByTestId("plan-overview-back-button");

        expect(hasHeaderEntrance("plan-overview-back-button")).toBe(true);
      },
      LONG_FLOW_TIMEOUT_MS,
    );
  });
});
