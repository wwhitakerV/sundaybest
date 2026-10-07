import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { countReflectionAnswers } from "@/core/storage/reflection-answers";
import { NEW_PLAN_HREF, planOverviewHref } from "@/entities/plan";
import { PlanCompleteScreen } from "@/features/plans/screens/PlanCompleteScreen";

// Notes live on the device only; the count is all Plan Complete reads.
jest.mock("@/core/storage/reflection-answers", () => ({ countReflectionAnswers: jest.fn() }));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

/** Seven days done; every Quick Check right but two answers on day 1. */
const FINISHED = (() => {
  const plan = aPlan({ seed: 4, title: "Break the Cycle", status: "completed", lengthDays: 7 });
  return {
    ...plan,
    days: plan.days.map((day) =>
      day.dayNumber === 1 && day.quickCheck
        ? { ...day, quickCheck: { ...day.quickCheck, correctCount: 1 } }
        : day,
    ),
  };
})();

/** Plan Complete for this plan, once its summary has arrived. */
async function renderPlanComplete(planId = FINISHED.id) {
  servePlans([FINISHED]);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId });
  render(<PlanCompleteScreen />);
  await screen.findByTestId("plan-complete-add-sermon-button");
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockExitSession.mockClear();
  jest.mocked(countReflectionAnswers).mockResolvedValue(5);
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ navigate: mockNavigate } as unknown as ReturnType<typeof useRouter>);
});

describe("PlanCompleteScreen", () => {
  it("celebrates at once, while the summary is on its way", () => {
    servePlans([FINISHED]);
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: FINISHED.id });
    render(<PlanCompleteScreen />);

    expect(screen.getByRole("header", { name: "Plan complete" })).toBeVisible();
    expect(screen.getByTestId("plan-complete-content-pending")).toBeOnTheScreen();
  });

  it("is laid out as a milestone page", async () => {
    await renderPlanComplete();

    expect(screen.getByTestId("plan-complete-screen-body")).toBeOnTheScreen();
  });

  it("is addressable as plan-complete-screen", async () => {
    await renderPlanComplete();

    expect(screen.getByTestId("plan-complete-screen")).toBeVisible();
  });

  it("says so for a plan the server doesn't have, with the way out of the session", async () => {
    servePlans([FINISHED]);
    jest
      .mocked(useLocalSearchParams)
      .mockReturnValue({ planId: "00000000-0000-4000-8000-00000000dead" });
    render(<PlanCompleteScreen />);

    expect(
      await screen.findByTestId("plan-complete-not-found", undefined, { timeout: 10000 }),
    ).toBeVisible();
    expect(screen.queryByTestId("plan-complete-screen")).toBeNull();
    fireEvent.press(screen.getByTestId("plan-complete-not-found-action"));
    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("is headed Plan complete", async () => {
    await renderPlanComplete();

    expect(screen.getByRole("header", { name: "Plan complete" })).toBeVisible();
  });

  it("closes back to the plan's overview from the top-left button", async () => {
    await renderPlanComplete();

    expect(screen.getByLabelText("Close")).toBeVisible();
    fireEvent.press(screen.getByTestId("plan-complete-close-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(planOverviewHref(FINISHED.id));
  });

  it("shows the days done out of the plan's days", async () => {
    await renderPlanComplete();

    const stat = within(screen.getByTestId("plan-complete-days"));
    expect(stat.getByText("7/7")).toBeVisible();
    expect(stat.getByText("Days")).toBeVisible();
  });

  it("shows how many notes were written", async () => {
    await renderPlanComplete();

    const stat = within(screen.getByTestId("plan-complete-notes"));
    expect(stat.getByText("5")).toBeVisible();
    expect(stat.getByText("Notes")).toBeVisible();
  });

  it("shows the Quick Check answers right out of all of them", async () => {
    await renderPlanComplete();

    const stat = within(screen.getByTestId("plan-complete-quiz"));
    expect(stat.getByText("19/21")).toBeVisible();
    expect(stat.getByText("Quiz")).toBeVisible();
  });

  it("invites the next sermon", async () => {
    await renderPlanComplete();

    expect(screen.getByText("Sunday's coming")).toBeVisible();
    expect(screen.getByText("Add next week's sermon and keep your streak going.")).toBeVisible();
  });

  it("goes to New Plan from Add sermon", async () => {
    await renderPlanComplete();

    expect(screen.getByText("Add sermon")).toBeVisible();
    fireEvent.press(screen.getByTestId("plan-complete-add-sermon-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NEW_PLAN_HREF);
  });

  it("shows a Share action", async () => {
    await renderPlanComplete();

    expect(screen.getByTestId("plan-complete-share-button")).toBeVisible();
    expect(screen.getByText("Share")).toBeVisible();
  });
});
