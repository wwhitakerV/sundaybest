import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { DayCompleteScreen } from "@/features/plans/screens/DayCompleteScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("DayCompleteScreen", () => {
  it("is addressable as day-complete-screen", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
    render(<DayCompleteScreen />);

    expect(screen.getByTestId("day-complete-screen")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
    render(<DayCompleteScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("navigates to Quick Check — Question when the quick check action is pressed", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
    render(<DayCompleteScreen />);

    fireEvent.press(screen.getByTestId("day-complete-quick-check-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/quick-check/question",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
      }),
    );
  });

  it("navigates to Plans when the Plans action is pressed", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
    render(<DayCompleteScreen />);

    fireEvent.press(screen.getByTestId("day-complete-plans-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/plans");
  });

  it("navigates to Home when the Home action is pressed", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
    render(<DayCompleteScreen />);

    fireEvent.press(screen.getByTestId("day-complete-home-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("shows a next-day action when days remain in the plan", () => {
    // plan-three-day: completedDays [1], totalDays 3 — day 1 just finished, day 2 remains.
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
    render(<DayCompleteScreen />);

    fireEvent.press(screen.getByTestId("day-complete-next-day-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/study",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day" }),
      }),
    );
  });

  it("does not show a next-day action once every day in the plan is complete", () => {
    // plan-one-day: totalDays 1 — completing day 1 finishes the whole plan.
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-one-day", day: "1" });
    render(<DayCompleteScreen />);

    expect(screen.queryByTestId("day-complete-next-day-button")).toBeNull();
  });
});
