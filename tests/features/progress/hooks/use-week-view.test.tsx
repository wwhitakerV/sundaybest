import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PLAN_UNDER_WAY, PROGRESS_NOW, serveProgress } from "@tests/factories/api-progress";
import * as haptics from "@/core/haptics/haptics";
import { useWeekView } from "@/features/progress/hooks/use-week-view";

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
  useLocalSearchParams: jest.fn(),
}));

const THIS_WEEK = "2026-09-20";
const OLDER_WEEK = "2026-08-30";

/** The weeks a plan ran in: this one, and — when asked — the seven-day plan's, weeks back. */
const weeksWith = (older: boolean) => ({
  weeks: [
    { weekStart: THIS_WEEK, planCount: 1, title: PLAN_UNDER_WAY.title },
    ...(older ? [{ weekStart: OLDER_WEEK, planCount: 1, title: "Break the Cycle" }] : []),
  ],
});

/** The week view, once its week has arrived. */
async function renderWeekView(older = false) {
  const asked = serveProgress({}, weeksWith(older));
  const view = renderHook(() => useWeekView());
  await waitFor(() => expect(view.result.current.loading).toBe(false), { timeout: 10000 });
  return { ...view, asked };
}

beforeEach(() => {
  jest.useFakeTimers({ now: PROGRESS_NOW, advanceTimers: true });
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: jest.fn() } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useWeekView", () => {
  it("opens on this week, on today", async () => {
    const { result, asked } = await renderWeekView();

    expect(asked).toContain(THIS_WEEK);
    expect(result.current).toMatchObject({ selectedDate: "2026-09-23", isToday: true });
  });

  it("can't step back with no older week a plan ran in, nor on past this week", async () => {
    const { result } = await renderWeekView();

    expect(result.current).toMatchObject({ canGoBack: false, canGoForward: false });
  });

  it("steps back to the last week a plan ran in, with a selection haptic", async () => {
    const { result, asked } = await renderWeekView(true);
    expect(result.current.canGoBack).toBe(true);

    act(() => result.current.previousWeek());

    await waitFor(() => expect(asked).toContain(OLDER_WEEK));
    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("steps forward again to this week", async () => {
    const { result, asked } = await renderWeekView(true);
    act(() => result.current.previousWeek());
    await waitFor(() => expect(result.current.canGoForward).toBe(true));

    act(() => result.current.nextWeek());

    await waitFor(() => expect(result.current.canGoForward).toBe(false));
    expect(asked.filter((week) => week === THIS_WEEK).length).toBeGreaterThanOrEqual(1);
  });

  it("picks a day, with a selection haptic, and stays quiet when it's picked again", async () => {
    const { result } = await renderWeekView();

    act(() => result.current.selectDay("2026-09-22"));
    act(() => result.current.selectDay("2026-09-22"));

    expect(result.current).toMatchObject({ selectedDate: "2026-09-22", isToday: false });
    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });
});
