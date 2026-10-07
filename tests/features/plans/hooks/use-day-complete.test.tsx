import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, aReminder } from "@tests/factories/api";
import { aPlan } from "@tests/factories/api-plans";
import { PROGRESS_NOW, serveProgress } from "@tests/factories/api-progress";
import { servePlans } from "@tests/mocks/plans-api";
import { server } from "@tests/mocks/server";
import * as haptics from "@/core/haptics/haptics";
import { planCompleteHref, planOverviewHref } from "@/entities/plan";
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
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

/** Three days, day 1 just finished. */
const STILL_PRAYING = aPlan({ seed: 2, title: "Still Praying", lengthDays: 3, completedDays: 1 });
/** One day, just finished — and with it, the plan. */
const TEMPTATION = aPlan({
  seed: 3,
  title: "Overcome Temptation",
  lengthDays: 1,
  status: "completed",
});

/** Day Complete for this plan's day, once its plan, progress and reminder have arrived. */
async function renderDayComplete(plan = STILL_PRAYING, day = "1") {
  servePlans([STILL_PRAYING, TEMPTATION]);
  // Today's study makes a two-day run.
  serveProgress({ streak: { current: 2, longest: 7 } });
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: plan.id, day });
  const view = renderHook(() => useDayComplete());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

beforeEach(() => {
  jest.useFakeTimers({ now: PROGRESS_NOW, advanceTimers: true });
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest.mocked(useRouter).mockReturnValue({
    navigate: mockNavigate,
    replace: mockReplace,
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useDayComplete", () => {
  it("finds nothing for a plan the server doesn't have", async () => {
    servePlans([STILL_PRAYING]);
    serveProgress();
    jest
      .mocked(useLocalSearchParams)
      .mockReturnValue({ planId: "00000000-0000-4000-8000-00000000dead", day: "1" });
    const { result } = renderHook(() => useDayComplete());

    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 10000 });
    expect(result.current.found).toBe(false);
  });

  it("finds nothing for a day the plan doesn't have", async () => {
    servePlans([STILL_PRAYING]);
    serveProgress();
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: STILL_PRAYING.id, day: "6" });
    const { result } = renderHook(() => useDayComplete());

    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 10000 });
    expect(result.current.found).toBe(false);
  });

  it("names the day just finished", async () => {
    const { result } = await renderDayComplete();

    expect(result.current).toMatchObject({ found: true, dayNumber: 1 });
  });

  it("is for today, as the server has it", async () => {
    const { result } = await renderDayComplete();

    expect(result.current).toMatchObject({ today: "2026-09-23" });
  });

  it("spells the streak, today's study included", async () => {
    const { result } = await renderDayComplete();

    expect(result.current).toMatchObject({ streakLabel: "Two day streak" });
  });

  it("holds the week's completion counts", async () => {
    const { result } = await renderDayComplete();
    const view = result.current;

    expect(view.found && view.week.map((day) => day.completedDayCount)).toEqual([
      0, 0, 1, 0, 0, 0, 0,
    ]);
  });

  it("looks ahead to the next day's reading, at the reminder's time", async () => {
    const { result } = await renderDayComplete();

    expect(result.current).toMatchObject({
      upNext: { title: "Day 2 reading", when: "Tomorrow at 6:30 AM" },
    });
  });

  it("says just Tomorrow when the daily reminder is off", async () => {
    servePlans([STILL_PRAYING]);
    serveProgress();
    server.use(
      http.get(`${API_URL}/v1/me/reminders`, () =>
        HttpResponse.json({ reminders: [aReminder({ enabled: false })] }),
      ),
    );
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: STILL_PRAYING.id, day: "1" });
    const { result } = renderHook(() => useDayComplete());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toMatchObject({
      upNext: { title: "Day 2 reading", when: "Tomorrow" },
    });
  });

  it("looks ahead to nothing after a plan's last day", async () => {
    const { result } = await renderDayComplete(TEMPTATION);

    expect(result.current).toMatchObject({ found: true, upNext: null });
  });

  it("no longer offers the old ways on", async () => {
    const { result } = await renderDayComplete();

    for (const gone of ["nextDay", "studyNextDay", "toPlans", "toHome", "takeQuickCheck"]) {
      expect(result.current).not.toHaveProperty(gone);
    }
  });

  it("leaves the session for the plan's overview on done", async () => {
    const { result } = await renderDayComplete();

    act(() => {
      if (result.current.found) result.current.done();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(planOverviewHref(STILL_PRAYING.id));
  });

  it("goes on to Plan Complete on done, when that day finished the plan", async () => {
    const { result } = await renderDayComplete(TEMPTATION);

    act(() => {
      if (result.current.found) result.current.done();
    });

    expect(mockReplace).toHaveBeenCalledWith(planCompleteHref(TEMPTATION.id));
    expect(mockExitSession).not.toHaveBeenCalled();
  });
});

describe("useDayComplete haptics", () => {
  it("gives nothing as it's done", async () => {
    const { result } = await renderDayComplete();

    act(() => {
      if (result.current.found) result.current.done();
    });

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
