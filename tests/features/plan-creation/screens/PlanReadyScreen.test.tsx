import { render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PlanReadyScreen } from "@/features/plan-creation/screens/PlanReadyScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();
// A ready plan in the mock data: three days, not started.
const PLAN_ID = "plan-faith-through-the-storm";

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: PLAN_ID });
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest.mocked(useRouter).mockReturnValue({
    replace: mockReplace,
    navigate: mockNavigate,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("PlanReadyScreen", () => {
  it("is addressable as plan-ready-screen", () => {
    render(<PlanReadyScreen />);

    expect(screen.getByTestId("plan-ready-screen")).toBeVisible();
  });

  it("says how long the plan runs and what it's from", () => {
    render(<PlanReadyScreen />);

    expect(screen.getByText("Your plan is ready")).toBeVisible();
    expect(screen.getByText("3 days from Faith Through the Storm")).toBeVisible();
  });

  it("sets the morning reminder to the time picked", () => {
    render(<PlanReadyScreen />);

    fireEvent.press(screen.getByTestId("plan-ready-reminder-07:00"));

    expect(screen.getByTestId("plan-ready-reminder-07:00")).toBeSelected();
    expect(screen.getByTestId("plan-ready-reminder-06:30")).not.toBeSelected();
  });

  it("opens day 1 of this plan when Start day 1 is pressed", async () => {
    render(<PlanReadyScreen />);

    fireEvent.press(screen.getByTestId("plan-ready-start-button"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/study/[planId]",
        params: { planId: PLAN_ID, day: "1" },
      });
    });
  });

  it("dismisses the flow to Home when Not now is pressed", () => {
    render(<PlanReadyScreen />);

    fireEvent.press(screen.getByTestId("plan-ready-not-now-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/home");
  });
});
