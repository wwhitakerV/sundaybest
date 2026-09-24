import { act, render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { BUILD_STAGE_MS } from "@/core/plan-builder";
import { PreparingPlanScreen } from "@/features/plan-creation/screens/PreparingPlanScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();
const mockExitModal = jest.fn<void, []>();
// The mock data's plan being built: four days with a Quick Check, writing its days.
const PLAN_ID = "plan-who-is-my-neighbor";

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: PLAN_ID });
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest.mocked(useRouter).mockReturnValue({
    replace: mockReplace,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("PreparingPlanScreen", () => {
  it("is addressable as preparing-plan-screen", () => {
    render(<PreparingPlanScreen />);

    expect(screen.getByTestId("preparing-plan-screen")).toBeVisible();
  });

  it("shows the plan being built, and where the build is", () => {
    render(<PreparingPlanScreen />);

    expect(screen.getByText("Preparing your plan")).toBeVisible();
    expect(screen.getByText("Who Is My Neighbor?")).toBeVisible();
    expect(screen.getByText("Writing your 4 days")).toBeVisible();
    expect(screen.getByTestId("preparing-plan-stages-writingDays")).toBeBusy();
  });

  it("leaves the flow when Close is pressed", () => {
    render(<PreparingPlanScreen />);

    fireEvent.press(screen.getByTestId("preparing-plan-close-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("moves on to Plan Ready once the plan is built", async () => {
    render(<PreparingPlanScreen />);

    // Writing the days, then the quiz, then done.
    for (let stage = 0; stage < 3; stage += 1) {
      // Each stage's timer is set once the last one lands, so one at a time.
      await act(async () => {
        jest.advanceTimersByTime(BUILD_STAGE_MS);
        await Promise.resolve();
      });
    }

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(plan-creation)/ready",
      params: { planId: PLAN_ID },
    });
  });
});
