import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, appReducer, type AppState } from "@/core/store";
import { DayCompleteScreen } from "@/features/plans/screens/DayCompleteScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

// Three days: day 1 just finished, days 2 and 3 to go.
const STORM = "plan-faith-through-the-storm";
// One day: finishing it finishes the plan.
const REST = "plan-come-to-me-and-rest";

/** The store once `dayNumber` of `planId` has been finished. */
function finished(planId: string, dayNumber: number): AppState {
  return appReducer(INITIAL_STATE, {
    type: "planDay/complete",
    dayId: `${planId}-day-${dayNumber}`,
    today: "2026-09-23",
    at: "2026-09-23T07:00:00.000Z",
  });
}

function renderDayComplete(planId: string, dayNumber: number) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId, day: String(dayNumber) });
  return render(
    <AppStoreProvider initialState={finished(planId, dayNumber)}>
      <DayCompleteScreen />
    </AppStoreProvider>,
  );
}

beforeEach(() => {
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    navigate: mockNavigate,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("DayCompleteScreen", () => {
  it("is addressable as day-complete-screen", () => {
    renderDayComplete(STORM, 1);

    expect(screen.getByTestId("day-complete-screen")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    renderDayComplete(STORM, 1);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("navigates to Quick Check — Question when the quick check action is pressed", () => {
    renderDayComplete(STORM, 1);

    fireEvent.press(screen.getByTestId("day-complete-quick-check-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/study/[planId]/quick-check",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: STORM, day: "1" }),
      }),
    );
  });

  it("navigates to Plans when the Plans action is pressed", () => {
    renderDayComplete(STORM, 1);

    fireEvent.press(screen.getByTestId("day-complete-plans-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/plans");
  });

  it("navigates to Home when the Home action is pressed", () => {
    renderDayComplete(STORM, 1);

    fireEvent.press(screen.getByTestId("day-complete-home-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("offers the next day, now open, when days remain in the plan", () => {
    renderDayComplete(STORM, 1);

    fireEvent.press(screen.getByTestId("day-complete-next-day-button"));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/study/[planId]",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: STORM, day: "2" }),
      }),
    );
  });

  it("offers no next day once every day in the plan is complete", () => {
    renderDayComplete(REST, 1);

    expect(screen.queryByTestId("day-complete-next-day-button")).toBeNull();
  });

  it("shows nothing for a plan that doesn't exist", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "no-such-plan", day: "1" });
    render(<DayCompleteScreen />);

    expect(screen.queryByTestId("day-complete-screen")).toBeNull();
  });
});
