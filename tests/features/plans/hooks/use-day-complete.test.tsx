import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import {
  AppStoreProvider,
  INITIAL_STATE,
  appReducer,
  getWeeklyCompletionCounts,
  type AppState,
} from "@/core/store";
import { planOverviewHref } from "@/entities/plan";
import { useDayComplete } from "@/features/plans/hooks/use-day-complete";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

// Three days: day 1 just finished. One day, with a Quick Check: finishing it finishes the plan.
const STILL_PRAYING = "plan-still-praying";
const TEMPTATION = "plan-overcome-temptation";

function finished(planId: string, from: AppState = INITIAL_STATE) {
  return appReducer(from, {
    type: "planDay/complete",
    dayId: `${planId}-day-1`,
    today: "2026-09-23",
    at: "2026-09-23T07:00:00.000Z",
  });
}

function useDayCompleteView() {
  return { view: useDayComplete() };
}

function renderDayComplete(planId: string, day = "1", from: AppState = INITIAL_STATE) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId, day });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStoreProvider initialState={finished(planId, from)}>{children}</AppStoreProvider>
  );
  return renderHook(() => useDayCompleteView(), { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest.mocked(useRouter).mockReturnValue({
    navigate: mockNavigate,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("useDayComplete", () => {
  it("finds nothing for a plan with no progress", () => {
    const { result } = renderDayComplete("plan-nope");

    expect(result.current.view.found).toBe(false);
  });

  it("finds nothing for a day the plan doesn't have", () => {
    const { result } = renderDayComplete(STILL_PRAYING, "9");

    expect(result.current.view.found).toBe(false);
  });

  it("names the day just finished", () => {
    const { result } = renderDayComplete(STILL_PRAYING);

    expect(result.current.view).toMatchObject({ found: true, dayNumber: 1 });
  });

  it("is for today, which the store fixes", () => {
    const { result } = renderDayComplete(STILL_PRAYING);

    expect(result.current.view).toMatchObject({ today: "2026-09-23" });
  });

  it("spells the streak, today's study included", () => {
    const { result } = renderDayComplete(STILL_PRAYING);

    // The mock data's run ends yesterday (one day); finishing today makes two.
    expect(result.current.view).toMatchObject({ streakLabel: "Two day streak" });
  });

  it("holds the week's completion counts, today's included", () => {
    const { result } = renderDayComplete(STILL_PRAYING);
    const view = result.current.view;

    expect(view.found && view.week).toEqual(
      getWeeklyCompletionCounts(finished(STILL_PRAYING), "2026-09-23"),
    );
    expect(view.found && view.week.map((day) => day.completedDayCount)).toEqual([
      0, 0, 1, 1, 0, 0, 0,
    ]);
  });

  it("looks ahead to the next day's reading, at the reminder's time", () => {
    const { result } = renderDayComplete(STILL_PRAYING);

    expect(result.current.view).toMatchObject({
      upNext: { title: "A refuge", when: "Tomorrow at 6:30 AM" },
    });
  });

  it("says just Tomorrow when the daily reminder is off", () => {
    const off = appReducer(INITIAL_STATE, {
      type: "settings/reminderEnabled",
      reminderId: "reminder-daily-study",
      enabled: false,
      at: "2026-09-23T06:00:00.000Z",
    });
    const { result } = renderDayComplete(STILL_PRAYING, "1", off);

    expect(result.current.view).toMatchObject({
      upNext: { title: "A refuge", when: "Tomorrow" },
    });
  });

  it("looks ahead to nothing after a plan's last day", () => {
    const { result } = renderDayComplete(TEMPTATION);

    expect(result.current.view).toMatchObject({ found: true, upNext: null });
  });

  it("no longer offers the old ways on", () => {
    const { result } = renderDayComplete(STILL_PRAYING);

    for (const gone of ["nextDay", "studyNextDay", "toPlans", "toHome"]) {
      expect(result.current.view).not.toHaveProperty(gone);
    }
  });

  it("leaves the session for the plan's overview on done", () => {
    const { result } = renderDayComplete(STILL_PRAYING);

    act(() => {
      if (result.current.view.found) result.current.view.done();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(planOverviewHref(STILL_PRAYING));
  });

  it("no longer offers a Quick Check or Back to Plan", () => {
    const { result } = renderDayComplete(TEMPTATION);

    for (const gone of ["takeQuickCheck", "hasQuickCheck", "backToPlan"]) {
      expect(result.current.view).not.toHaveProperty(gone);
    }
  });
});

describe("useDayComplete haptics", () => {
  it("gives nothing as it's done", () => {
    const { result } = renderDayComplete(TEMPTATION);

    act(() => {
      if (result.current.view.found) result.current.view.done();
    });

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
