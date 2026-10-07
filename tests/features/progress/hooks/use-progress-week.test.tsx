import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PLAN_UNDER_WAY, PROGRESS_NOW, serveProgress } from "@tests/factories/api-progress";
import * as haptics from "@/core/haptics/haptics";
import { studyHref } from "@/entities/plan";
import { useProgressWeek } from "@/features/progress/hooks/use-progress-week";

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
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

/** The week's view model, once this week's progress has arrived. */
async function renderWeek() {
  const asked = serveProgress();
  const view = renderHook(() => useProgressWeek());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return { ...view, asked };
}

beforeEach(() => {
  jest.useFakeTimers({ now: PROGRESS_NOW, advanceTimers: true });
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useProgressWeek", () => {
  it("starts on this week: Sunday 20 September to Saturday 26th", async () => {
    const { result } = await renderWeek();

    expect(result.current.weekOffset).toBe(0);
    expect(result.current.week.at(0)?.date).toBe("2026-09-20");
    expect(result.current.week.at(-1)?.date).toBe("2026-09-26");
  });

  it("lays out the week's seven days, empty, before its progress arrives", () => {
    serveProgress();
    const { result } = renderHook(() => useProgressWeek());

    expect(result.current.loading).toBe(true);
    expect(result.current.week).toHaveLength(7);
    expect(result.current.week.every(({ completedDayCount }) => completedDayCount === 0)).toBe(
      true,
    );
  });

  it("moves the week back seven days on previousWeek, asking for that week", async () => {
    const { result, asked } = await renderWeek();

    act(() => result.current.previousWeek());

    expect(result.current.weekOffset).toBe(-1);
    await waitFor(() => expect(result.current.week.at(0)?.date).toBe("2026-09-13"));
    expect(asked).toContain("2026-09-13");
  });

  it("moves forward again on nextWeek after going back", async () => {
    const { result } = await renderWeek();

    act(() => result.current.previousWeek());
    act(() => result.current.nextWeek());

    expect(result.current.weekOffset).toBe(0);
    await waitFor(() => expect(result.current.week.at(0)?.date).toBe("2026-09-20"));
  });

  it("says what's up next: the plan under way's day 2, today", async () => {
    const { result } = await renderWeek();

    expect(result.current.upNext).toMatchObject({
      plan: { id: PLAN_UNDER_WAY.id },
      day: { dayNumber: 2 },
      date: "2026-09-23",
      minutes: 9,
      percent: 17,
    });
  });

  it("opens the day up next with openUpNext", async () => {
    const { result } = await renderWeek();

    act(() => result.current.openUpNext());

    expect(mockPush).toHaveBeenCalledWith(studyHref(PLAN_UNDER_WAY.id, 2));
  });

  it("does nothing on openUpNext when nothing's up next", async () => {
    serveProgress({ upNext: null });
    const { result } = renderHook(() => useProgressWeek());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.openUpNext());

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("selects once going back a week", async () => {
    const { result } = await renderWeek();

    act(() => result.current.previousWeek());

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("selects once going forward a week", async () => {
    const { result } = await renderWeek();

    act(() => result.current.nextWeek());

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });
});
