import Svg from "react-native-svg";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, appReducer, type AppState } from "@/core/store";
import { DayCompleteScreen } from "@/features/plans/screens/DayCompleteScreen";
import { lightTheme } from "@/theme/tokens";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

// Three days: day 1 just finished, days 2 and 3 to go.
const STILL_PRAYING = "plan-still-praying";
// One day: finishing it finishes the plan.
const TEMPTATION = "plan-overcome-temptation";

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
    replace: mockReplace,
    navigate: mockNavigate,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("DayCompleteScreen", () => {
  it("says so for a plan that doesn't exist, with the way out of the session", () => {
    renderDayComplete("no-such-plan", 1);

    expect(screen.queryByTestId("day-complete-screen")).toBeNull();
    expect(screen.getByRole("header", { name: "This day isn't here" })).toBeVisible();
    fireEvent.press(screen.getByTestId("day-complete-not-found-action"));
    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("is addressable as day-complete-screen", () => {
    renderDayComplete(STILL_PRAYING, 1);

    expect(screen.getByTestId("day-complete-screen")).toBeVisible();
  });

  it("celebrates the day with the flame ring and a header", () => {
    renderDayComplete(STILL_PRAYING, 1);

    expect(screen.getByTestId("day-complete-ring")).toBeVisible();
    expect(screen.getByRole("header", { name: "Day 1 done" })).toBeVisible();
  });

  it("spells the streak, today's study included", () => {
    renderDayComplete(STILL_PRAYING, 1);

    expect(screen.getByTestId("day-complete-streak")).toBeVisible();
    expect(screen.getByText("Two day streak")).toBeVisible();
  });

  it("shows the week", () => {
    renderDayComplete(STILL_PRAYING, 1);

    expect(screen.getByTestId("day-complete-week")).toBeVisible();
  });

  it("looks ahead to the next day's reading and when", () => {
    renderDayComplete(STILL_PRAYING, 1);

    expect(screen.getByTestId("day-complete-up-next")).toBeVisible();
    expect(screen.getByText("Up next: A refuge")).toBeVisible();
    expect(screen.getByText("Tomorrow at 6:30 AM")).toBeVisible();
  });

  it("looks ahead to nothing after a plan's last day", () => {
    renderDayComplete(TEMPTATION, 1);

    expect(screen.queryByTestId("day-complete-up-next")).toBeNull();
  });

  it("offers one button, Done!, whatever the day", () => {
    renderDayComplete(TEMPTATION, 1);

    expect(screen.getByTestId("day-complete-done-button")).toBeVisible();
    expect(screen.getByText("Done!")).toBeVisible();
    expect(screen.queryByTestId("day-complete-quick-check-button")).toBeNull();
    expect(screen.queryByTestId("day-complete-back-button")).toBeNull();
  });

  it("leaves the session for the plan's overview on Done!", () => {
    renderDayComplete(STILL_PRAYING, 1);

    fireEvent.press(screen.getByTestId("day-complete-done-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: STILL_PRAYING },
    });
  });

  it("is laid out as a milestone page", () => {
    renderDayComplete(STILL_PRAYING, 1);

    expect(screen.getByTestId("day-complete-screen-body")).toBeOnTheScreen();
  });

  it("marks the day with an outline flame, not a filled one", () => {
    renderDayComplete(STILL_PRAYING, 1);

    const flame = within(screen.getByTestId("day-complete-ring")).UNSAFE_getByType(Svg);
    expect(flame.props.fill ?? "none").toBe("none");
  });

  it("rings the day in red", () => {
    renderDayComplete(STILL_PRAYING, 1);

    expect(screen.getByTestId("day-complete-ring")).toHaveStyle({
      borderColor: lightTheme.colors.accent,
    });
  });
});
