import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { dayCompleteHref, quickCheckHref } from "@/entities/plan";
import {
  AppStoreProvider,
  INITIAL_STATE,
  getPlanDay,
  getPlanProgress,
  getPrayerForDay,
  getReflectionsForDay,
  useAppSelector,
} from "@/core/store";
import { useStudySession } from "@/features/plans/hooks/use-study-session";

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

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();
// Ready, not started: three days, day 1 open.
const STILL_PRAYING = "plan-still-praying";
const DAY_ID = `${STILL_PRAYING}-day-1`;

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

/** The session, and what the store holds for the day it works through. */
function useSessionAndStore() {
  const session = useStudySession();
  const store = useAppSelector((state) => ({
    steps: getPlanDay(state, STILL_PRAYING, 1)?.completedSteps ?? [],
    dayStatus: getPlanDay(state, STILL_PRAYING, 1)?.status,
    done: getPlanProgress(state, STILL_PRAYING)?.completedDayCount,
    answers: getReflectionsForDay(state, DAY_ID).map((reflection) => reflection.answer),
    prayedAt: getPrayerForDay(state, DAY_ID)?.prayedAt ?? null,
  }));
  const settings = useAppSelector((state) => state.settings);
  return { session, store, settings };
}

function renderStudy(params: Record<string, string> = { planId: STILL_PRAYING, day: "1" }) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  return renderHook(() => useSessionAndStore(), { wrapper });
}

/** Presses Next once on the open session. */
function next(result: { current: ReturnType<typeof useSessionAndStore> }) {
  act(() => {
    if (result.current.session.found) result.current.session.next();
  });
}

beforeEach(() => {
  mockReplace.mockClear();
  mockExitSession.mockClear();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ replace: mockReplace } as unknown as ReturnType<typeof useRouter>);
});

describe("useStudySession", () => {
  it("finds no day when the day isn't a number", () => {
    const { result } = renderStudy({ planId: STILL_PRAYING, day: "abc" });

    expect(result.current.session.found).toBe(false);
  });

  it("finds no day when the plan doesn't have it", () => {
    const { result } = renderStudy({ planId: STILL_PRAYING, day: "9" });

    expect(result.current.session.found).toBe(false);
  });

  it("finds no day when the plan doesn't exist", () => {
    const { result } = renderStudy({ planId: "plan-nope", day: "1" });

    expect(result.current.session.found).toBe(false);
  });

  it("opens on the first page of Read, with the day's context", () => {
    const { result } = renderStudy();

    expect(result.current.session).toMatchObject({
      found: true,
      dayNumber: 1,
      totalDays: 3,
      position: { step: 0, page: 0 },
      isLastPage: false,
    });
  });

  it("moves on to Scripture on next()", () => {
    const { result } = renderStudy();

    next(result);

    expect(result.current.session).toMatchObject({ position: { step: 1, page: 0 } });
  });

  it("records the step done, starting the day, when moving forward", () => {
    const { result } = renderStudy();

    next(result);

    expect(result.current.store.steps).toEqual(["read"]);
    expect(result.current.store.dayStatus).toBe("inProgress");
  });

  it("leaves the study on previous() from the first page", () => {
    const { result } = renderStudy();

    act(() => {
      if (result.current.session.found) result.current.session.previous();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("goes back a step on previous() after the first", () => {
    const { result } = renderStudy();
    next(result);

    act(() => {
      if (result.current.session.found) result.current.session.previous();
    });

    expect(result.current.session).toMatchObject({ position: { step: 0, page: 0 } });
    expect(mockExitSession).not.toHaveBeenCalled();
  });

  it("leaves the study on close()", () => {
    const { result } = renderStudy();
    next(result);

    act(() => {
      if (result.current.session.found) result.current.session.close();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("shows the answer typed, before it's saved", () => {
    const { result } = renderStudy();
    const reflectionId = result.current.session.found
      ? (result.current.session.content.reflections.at(0)?.id ?? "")
      : "";

    act(() => {
      if (result.current.session.found) {
        result.current.session.changeAnswer(reflectionId, "The move, mostly.");
      }
    });

    expect(result.current.session.found && result.current.session.answerFor(reflectionId)).toBe(
      "The move, mostly.",
    );
    expect(result.current.store.answers).not.toContain("The move, mostly.");
  });

  it("writes a typed answer to the day on next()", () => {
    const { result } = renderStudy();
    next(result);
    next(result);
    const reflectionId = result.current.session.found
      ? (result.current.session.content.reflections.at(0)?.id ?? "")
      : "";
    act(() => {
      if (result.current.session.found) {
        result.current.session.changeAnswer(reflectionId, "The move, mostly.");
      }
    });

    next(result);

    expect(result.current.store.answers.at(0)).toBe("The move, mostly.");
  });

  it("writes a typed answer to the day on close(), too", () => {
    const { result } = renderStudy();
    const reflectionId = result.current.session.found
      ? (result.current.session.content.reflections.at(0)?.id ?? "")
      : "";
    act(() => {
      if (result.current.session.found) {
        result.current.session.changeAnswer(reflectionId, "The move, mostly.");
      }
    });

    act(() => {
      if (result.current.session.found) result.current.session.close();
    });

    expect(result.current.store.answers.at(0)).toBe("The move, mostly.");
  });

  it("doesn't complete the day by reaching the last page", () => {
    const { result } = renderStudy();

    for (let guard = 0; guard < 10 && !isLast(result.current); guard += 1) next(result);

    expect(isLast(result.current)).toBe(true);
    expect(result.current.store.done).toBe(0);
  });

  it("finishes the day on next() from the last page: completed, prayed, and Day Complete shown", () => {
    const { result } = renderStudy();
    for (let guard = 0; guard < 10 && !isLast(result.current); guard += 1) next(result);

    next(result);

    expect(result.current.store.dayStatus).toBe("completed");
    expect(result.current.store.done).toBe(1);
    expect(result.current.store.prayedAt).not.toBeNull();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/study/[planId]/day-complete",
      params: { planId: STILL_PRAYING, day: "1" },
    });
  });

  describe("reading", () => {
    it("starts at the store's settings: no offset, white paper", () => {
      const { result } = renderStudy();

      expect(result.current.session).toMatchObject({
        found: true,
        reading: { textOffset: 0, paper: "white" },
      });
    });

    it("changes the text offset, and the store holds it, on setTextOffset", () => {
      const { result } = renderStudy();

      act(() => {
        if (result.current.session.found) result.current.session.reading.setTextOffset(4);
      });

      expect(result.current.session).toMatchObject({ reading: { textOffset: 4 } });
      expect(result.current.settings.readingTextOffset).toBe(4);
    });

    it("refuses an offset off the scale", () => {
      const { result } = renderStudy();

      act(() => {
        if (result.current.session.found) result.current.session.reading.setTextOffset(10);
      });

      expect(result.current.session).toMatchObject({ reading: { textOffset: 0 } });
    });

    it("changes the paper, and the store holds it, on setPaper", () => {
      const { result } = renderStudy();

      act(() => {
        if (result.current.session.found) result.current.session.reading.setPaper("night");
      });

      expect(result.current.session).toMatchObject({ reading: { paper: "night" } });
      expect(result.current.settings.readingPaper).toBe("night");
    });
  });
});

function isLast({ session }: ReturnType<typeof useSessionAndStore>) {
  return session.found && session.isLastPage;
}

describe("useStudySession haptics", () => {
  /** Presses Previous once on the open session. */
  function previous(result: { current: ReturnType<typeof useSessionAndStore> }) {
    act(() => {
      if (result.current.session.found) result.current.session.previous();
    });
  }

  it("taps on Next from a middle page", () => {
    const { result } = renderStudy();

    next(result);

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });

  it("taps on Previous from a later page", () => {
    const { result } = renderStudy();
    next(result);
    jest.mocked(haptics.tapFeedback).mockClear();

    previous(result);

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing on Previous from the first page, which closes the session", () => {
    const { result } = renderStudy();

    previous(result);

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });

  it("gives success and no tap on Finish", () => {
    const { result } = renderStudy();
    while (result.current.session.found && !result.current.session.isLastPage) next(result);
    jest.mocked(haptics.tapFeedback).mockClear();

    next(result);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(haptics.successFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("selects once when the text size steps", () => {
    const { result } = renderStudy();

    act(() => {
      if (result.current.session.found) result.current.session.reading.setTextOffset(4);
    });

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("is silent for a text size the store refuses", () => {
    const { result } = renderStudy();

    act(() => {
      if (result.current.session.found) result.current.session.reading.setTextOffset(10);
    });

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });

  it("is silent when the text size is set to what it already is", () => {
    const { result } = renderStudy();

    act(() => {
      if (result.current.session.found) result.current.session.reading.setTextOffset(0);
    });

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });

  it("selects once when another paper is picked", () => {
    const { result } = renderStudy();

    act(() => {
      if (result.current.session.found) result.current.session.reading.setPaper("night");
    });

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("is silent when the current paper is picked again", () => {
    const { result } = renderStudy();

    act(() => {
      if (result.current.session.found) result.current.session.reading.setPaper("white");
    });

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });
});

describe("useStudySession Finish on a day with a Quick Check", () => {
  // One day with a two-question Quick Check not yet taken.
  const TEMPTATION = "plan-overcome-temptation";
  // Day 1's Quick Check is already finished in the mock data.
  const BLESSING = "plan-today-i-choose-to-be-a-blessing";

  function useSessionAndDay() {
    const session = useStudySession();
    const dayStatus = useAppSelector((state) => getPlanDay(state, PLAN.current, 1)?.status);
    return { session, dayStatus };
  }
  const PLAN = { current: TEMPTATION };

  function renderOn(planId: string, initialState = INITIAL_STATE) {
    PLAN.current = planId;
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId, day: "1" });
    return renderHook(() => useSessionAndDay(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AppStoreProvider initialState={initialState}>{children}</AppStoreProvider>
      ),
    });
  }

  function toLastPage(result: { current: ReturnType<typeof useSessionAndDay> }) {
    for (let guard = 0; guard < 10; guard += 1) {
      const { session } = result.current;
      if (!session.found || session.isLastPage) break;
      act(() => session.next());
    }
    jest.mocked(haptics.tapFeedback).mockClear();
  }

  function finish(result: { current: ReturnType<typeof useSessionAndDay> }) {
    act(() => {
      if (result.current.session.found) result.current.session.next();
    });
  }

  it("opens the Quick Check, not Day Complete, on Finish", () => {
    const { result } = renderOn(TEMPTATION);
    toLastPage(result);

    finish(result);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(quickCheckHref(TEMPTATION, 1));
  });

  it("leaves the day not completed on Finish, until its Quick Check is done", () => {
    const { result } = renderOn(TEMPTATION);
    toLastPage(result);

    finish(result);

    expect(result.current.dayStatus).not.toBe("completed");
  });

  it("taps, and gives no success, on Finish into the Quick Check", () => {
    const { result } = renderOn(TEMPTATION);
    toLastPage(result);

    finish(result);

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });

  it("completes the day, and shows Day Complete, when its Quick Check is already completed", () => {
    // Day 1 is made not-yet-done; its Quick Check stays finished.
    const day = getPlanDay(INITIAL_STATE, BLESSING, 1);
    if (!day) throw new Error("mock day missing");
    const reopened = {
      ...INITIAL_STATE,
      planDays: { ...INITIAL_STATE.planDays, [day.id]: { ...day, status: "inProgress" as const } },
    };
    const { result } = renderOn(BLESSING, reopened);
    expect(result.current.dayStatus).not.toBe("completed");
    toLastPage(result);

    finish(result);

    expect(result.current.dayStatus).toBe("completed");
    expect(mockReplace).toHaveBeenCalledWith(dayCompleteHref(BLESSING, 1));
    expect(haptics.successFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
