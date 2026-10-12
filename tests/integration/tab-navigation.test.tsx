import { router } from "expo-router";

import { act, fireEvent, renderApp, screen } from "@tests/helpers/render";

import { aPlan } from "@tests/factories/api-plans";
import { serveProgress } from "@tests/factories/api-progress";
import { servePlans } from "@tests/mocks/plans-api";

// Welcome stays mounted under every other screen, and its intro story would
// keep ticking through the fake timers these flows advance. Reduce Motion
// holds it still, as it does for people who turn it on.
jest.mock("@/core/accessibility/use-reduce-motion", () => ({
  useReduceMotion: () => true,
  useReduceMotionSetting: () => true,
}));

const PLAN = aPlan({ seed: 1, title: "Today I Choose to Be a Blessing", completedDays: 1 });

/** A returning reader: the app opens on Home. */
async function openApp() {
  servePlans([PLAN]);
  serveProgress();
  const view = renderApp();
  await screen.findByTestId("home-tab-screen");
  return view;
}

/** The plan's overview, from the Plans tab. */
async function openPlanFromPlans() {
  fireEvent.press(screen.getByTestId("tab-plans"));
  fireEvent.press(await screen.findByTestId(`plans-item-${PLAN.id}`));
  await screen.findByTestId("plan-overview-continue-button");
}

/** One of the plan's More menu items. */
async function pickFromMore(item: "reminder" | "how-made") {
  fireEvent.press(screen.getByTestId("plan-overview-more-button"));
  fireEvent.press(await screen.findByTestId(`plan-overview-more-${item}`));
}

/** The long walks run on fake timers, through the whole route tree. */
const LONG_FLOW_TIMEOUT_MS = 60_000;

describe("moving between tabs, as iOS does", () => {
  it(
    "opens Daily reminder over the plan, in Plans, and Back returns to the plan — Settings keeps its own first page",
    async () => {
      const view = await openApp();
      await openPlanFromPlans();

      await pickFromMore("reminder");
      expect(view.getPathname()).toBe("/plans/daily-reminder");
      expect(await screen.findByTestId("daily-reminder-screen")).toBeVisible();

      fireEvent.press(screen.getByTestId("daily-reminder-back-button"));
      expect(view.getPathname()).toBe(`/plans/${PLAN.id}`);

      fireEvent.press(screen.getByTestId("tab-settings"));
      expect(view.getPathname()).toBe("/settings");
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "keeps How plans are made, Privacy policy and its pages in the plan's tab, Back stepping through them to the plan",
    async () => {
      const view = await openApp();
      await openPlanFromPlans();

      await pickFromMore("how-made");
      expect(view.getPathname()).toBe("/plans/how-plans-are-made");

      fireEvent.press(await screen.findByTestId("how-plans-are-made-privacy-privacy"));
      expect(view.getPathname()).toBe("/plans/privacy-policy");

      fireEvent.press(await screen.findByTestId("privacy-policy-details-controls"));
      expect(view.getPathname()).toBe("/plans/privacy/controls");

      fireEvent.press(await screen.findByTestId("privacy-topic-section-0-actions-text-size"));
      expect(view.getPathname()).toBe("/plans/text-size");

      fireEvent.press(screen.getByTestId("text-size-back-button"));
      expect(view.getPathname()).toBe("/plans/privacy/controls");
      fireEvent.press(screen.getByTestId("privacy-topic-back-button"));
      expect(view.getPathname()).toBe("/plans/privacy-policy");
      fireEvent.press(screen.getByTestId("privacy-policy-back-button"));
      expect(view.getPathname()).toBe("/plans/how-plans-are-made");
      fireEvent.press(screen.getByTestId("how-plans-are-made-back-button"));
      expect(view.getPathname()).toBe(`/plans/${PLAN.id}`);
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "opens Bible translation from the Study's Scripture pill inside the Study, and Back returns to the passage",
    async () => {
      const view = await openApp();
      await openPlanFromPlans();
      fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
      await screen.findByTestId("study-read-body");
      fireEvent.press(screen.getByTestId("study-nav-next-button"));
      await screen.findByTestId("study-scripture-body");
      const study = view.getPathname();

      fireEvent.press(screen.getByRole("button", { name: /^Bible translation:/ }));
      expect(view.getPathname()).toBe("/study/bible-translation");
      expect(await screen.findByTestId("bible-translation-screen")).toBeVisible();

      fireEvent.press(screen.getByTestId("bible-translation-back-button"));
      expect(view.getPathname()).toBe(study);
      expect(await screen.findByTestId("study-scripture-body")).toBeVisible();
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "returns a tab to its first page when it's tapped again",
    async () => {
      const view = await openApp();
      await openPlanFromPlans();

      fireEvent.press(screen.getByTestId("tab-plans"));
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });
      expect(view.getPathname()).toBe("/plans");
    },
    LONG_FLOW_TIMEOUT_MS,
  );

  it(
    "never strands a tab without its first page: tapped again, it goes home even if a link left it without one",
    async () => {
      const view = await openApp();

      // A link from another tab that forgets to put Settings' first page underneath.
      act(() => router.push("/(tabs)/settings/daily-reminder"));
      await screen.findByTestId("daily-reminder-screen");

      fireEvent.press(screen.getByTestId("tab-settings"));
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });
      expect(view.getPathname()).toBe("/settings");
      expect(await screen.findByTestId("settings-daily-reminder-row")).toBeVisible();
    },
    LONG_FLOW_TIMEOUT_MS,
  );
});
