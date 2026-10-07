import Svg from "react-native-svg";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { PROGRESS_NOW, serveProgress } from "@tests/factories/api-progress";
import { servePlans } from "@tests/mocks/plans-api";
import { planCompleteHref, planOverviewHref } from "@/entities/plan";
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

/** Three days: day 1 just finished, days 2 and 3 to go. */
const STILL_PRAYING = aPlan({ seed: 2, title: "Still Praying", lengthDays: 3, completedDays: 1 });
/** One day: finishing it finished the plan. */
const TEMPTATION = aPlan({
  seed: 3,
  title: "Overcome Temptation",
  lengthDays: 1,
  status: "completed",
});

/** Day Complete for this plan's day, once it has what it shows. */
async function renderDayComplete(plan = STILL_PRAYING, dayNumber = 1) {
  servePlans([STILL_PRAYING, TEMPTATION]);
  // Today's study makes a two-day run.
  serveProgress({ streak: { current: 2, longest: 7 } });
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: plan.id, day: String(dayNumber) });
  render(<DayCompleteScreen />);
  await screen.findByTestId("day-complete-done-button");
}

beforeEach(() => {
  jest.useFakeTimers({ now: PROGRESS_NOW, advanceTimers: true });
  mockReplace.mockClear();
  mockNavigate.mockClear();
  mockExitSession.mockClear();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest.mocked(useRouter).mockReturnValue({
    replace: mockReplace,
    navigate: mockNavigate,
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("DayCompleteScreen", () => {
  it("says so for a day it can't find, with the way out of the session", async () => {
    servePlans([STILL_PRAYING]);
    serveProgress();
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: STILL_PRAYING.id, day: "6" });
    render(<DayCompleteScreen />);

    expect(
      await screen.findByRole("header", { name: "This day isn’t here" }, { timeout: 10000 }),
    ).toBeVisible();
    expect(screen.queryByTestId("day-complete-done-button")).toBeNull();
    fireEvent.press(screen.getByTestId("day-complete-not-found-action"));
    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("celebrates the day at once, while the rest is on its way", () => {
    servePlans([STILL_PRAYING]);
    serveProgress();
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: STILL_PRAYING.id, day: "1" });
    render(<DayCompleteScreen />);

    expect(screen.getByRole("header", { name: "Day 1 done" })).toBeVisible();
    expect(screen.getByTestId("day-complete-content-pending")).toBeOnTheScreen();
  });

  it("is addressable as day-complete-screen", async () => {
    await renderDayComplete();

    expect(screen.getByTestId("day-complete-screen")).toBeVisible();
  });

  it("celebrates the day with the flame ring and a header", async () => {
    await renderDayComplete();

    expect(screen.getByTestId("day-complete-ring")).toBeVisible();
    expect(screen.getByRole("header", { name: "Day 1 done" })).toBeVisible();
  });

  it("spells the streak, today's study included", async () => {
    await renderDayComplete();

    expect(screen.getByTestId("day-complete-streak")).toBeVisible();
    expect(screen.getByText("Two day streak")).toBeVisible();
  });

  it("shows the week", async () => {
    await renderDayComplete();

    expect(screen.getByTestId("day-complete-week")).toBeVisible();
  });

  it("looks ahead to the next day's reading and when", async () => {
    await renderDayComplete();

    expect(screen.getByTestId("day-complete-up-next")).toBeVisible();
    expect(screen.getByText("Up next: Day 2 reading")).toBeVisible();
    expect(screen.getByText("Tomorrow at 6:30 AM")).toBeVisible();
  });

  it("looks ahead to nothing after a plan's last day", async () => {
    await renderDayComplete(TEMPTATION);

    expect(screen.queryByTestId("day-complete-up-next")).toBeNull();
  });

  it("offers one button, Done!, whatever the day", async () => {
    await renderDayComplete(TEMPTATION);

    expect(screen.getByTestId("day-complete-done-button")).toBeVisible();
    expect(screen.getByText("Done!")).toBeVisible();
    expect(screen.queryByTestId("day-complete-quick-check-button")).toBeNull();
    expect(screen.queryByTestId("day-complete-back-button")).toBeNull();
  });

  it("leaves the session for the plan's overview on Done!", async () => {
    await renderDayComplete();

    fireEvent.press(screen.getByTestId("day-complete-done-button"));

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(planOverviewHref(STILL_PRAYING.id));
  });

  it("goes on to Plan Complete on Done! when the day finished the plan", async () => {
    await renderDayComplete(TEMPTATION);

    fireEvent.press(screen.getByTestId("day-complete-done-button"));

    expect(mockReplace).toHaveBeenCalledWith(planCompleteHref(TEMPTATION.id));
  });

  it("is laid out as a milestone page", async () => {
    await renderDayComplete();

    expect(screen.getByTestId("day-complete-screen-body")).toBeOnTheScreen();
  });

  it("marks the day with an outline flame, not a filled one", async () => {
    await renderDayComplete();

    const flame = within(screen.getByTestId("day-complete-ring")).UNSAFE_getByType(Svg);
    expect(flame.props.fill ?? "none").toBe("none");
  });

  it("rings the day in red", async () => {
    await renderDayComplete();

    expect(screen.getByTestId("day-complete-ring")).toHaveStyle({
      borderColor: lightTheme.colors.accent,
    });
  });
});
