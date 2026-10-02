import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PlanCompleteScreen } from "@/features/plans/screens/PlanCompleteScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

// Finished in the mock data: seven days done, a note on each, 16 of 21 Quick Check answers right.
const FINISHED = "plan-break-the-cycle-of-negative-thinking";

function renderPlanComplete(planId = FINISHED) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId });
  return render(<PlanCompleteScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ navigate: mockNavigate } as unknown as ReturnType<typeof useRouter>);
});

describe("PlanCompleteScreen", () => {
  it("is laid out as a milestone page", () => {
    renderPlanComplete();

    expect(screen.getByTestId("plan-complete-screen-body")).toBeOnTheScreen();
  });

  it("is addressable as plan-complete-screen", () => {
    renderPlanComplete();

    expect(screen.getByTestId("plan-complete-screen")).toBeVisible();
  });

  it("says so for a plan that doesn't exist, with the way out of the session", () => {
    renderPlanComplete("no-such-plan");

    expect(screen.queryByTestId("plan-complete-screen")).toBeNull();
    expect(screen.getByTestId("plan-complete-not-found")).toBeVisible();
    fireEvent.press(screen.getByTestId("plan-complete-not-found-action"));
    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("is headed Plan complete", () => {
    renderPlanComplete();

    expect(screen.getByRole("header", { name: "Plan complete" })).toBeVisible();
  });

  it("closes back to the plan's overview from the top-left button", () => {
    renderPlanComplete();

    expect(screen.getByLabelText("Close")).toBeVisible();
    fireEvent.press(screen.getByTestId("plan-complete-close-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: FINISHED },
    });
  });

  it("shows the days done out of the plan's days", () => {
    renderPlanComplete();

    const stat = within(screen.getByTestId("plan-complete-days"));
    expect(stat.getByText("7/7")).toBeVisible();
    expect(stat.getByText("Days")).toBeVisible();
  });

  it("shows how many notes were written", () => {
    renderPlanComplete();

    const stat = within(screen.getByTestId("plan-complete-notes"));
    expect(stat.getByText("7")).toBeVisible();
    expect(stat.getByText("Notes")).toBeVisible();
  });

  it("shows the Quick Check answers right out of all of them", () => {
    renderPlanComplete();

    const stat = within(screen.getByTestId("plan-complete-quiz"));
    expect(stat.getByText("16/21")).toBeVisible();
    expect(stat.getByText("Quiz")).toBeVisible();
  });

  it("invites the next sermon", () => {
    renderPlanComplete();

    expect(screen.getByText("Sunday's coming")).toBeVisible();
    expect(screen.getByText("Add next week's sermon and keep your streak going.")).toBeVisible();
  });

  it("goes to New Plan from Add sermon", () => {
    renderPlanComplete();

    expect(screen.getByText("Add sermon")).toBeVisible();
    fireEvent.press(screen.getByTestId("plan-complete-add-sermon-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
  });

  it("shows a Share action", () => {
    renderPlanComplete();

    expect(screen.getByTestId("plan-complete-share-button")).toBeVisible();
    expect(screen.getByText("Share")).toBeVisible();
  });
});
