import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan, aQuizSession } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import * as haptics from "@/core/haptics/haptics";
import type { ApiPlanDetail } from "@/core/api/contracts";
import { dayCompleteHref } from "@/entities/plan";
import { useQuickCheckSession } from "@/features/plans/hooks/use-quick-check-session";

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

const STUDIED = ["read", "scripture", "reflect", "pray"] as const;
/** Day 2's study done, its three-question Quick Check not taken. */
const NOT_STARTED = aPlan({ seed: 1, completedDays: 1, currentDaySteps: STUDIED });
/** Day 2's Quick Check under way: its first question answered, right. */
const UNDER_WAY = aPlan({
  seed: 1,
  completedDays: 1,
  currentDaySteps: STUDIED,
  quickCheck: { status: "inProgress", answered: 1, correct: 1 },
});
/** Day 2's Quick Check finished: two of three right. */
const FINISHED = aPlan({
  seed: 1,
  completedDays: 1,
  currentDaySteps: STUDIED,
  quickCheck: { status: "completed", answered: 3, correct: 2 },
});
/** A plan made without Quick Checks. */
const NO_QUIZ = aPlan({ seed: 2, completedDays: 1, quickCheckEnabled: false });

const quizOf = (plan: ApiPlanDetail) => plan.days[1]?.quickCheckId ?? "";

/** Day 2's Quick Check, once it has what it shows. */
async function renderQuickCheck(
  plan: ApiPlanDetail = NOT_STARTED,
  quizzes: Parameters<typeof servePlans>[1] = {},
  day = "2",
) {
  const seen = servePlans([plan], quizzes);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: plan.id, day });
  const view = renderHook(() => useQuickCheckSession());
  await waitFor(() => expect(view.result.current.loading).toBe(false), { timeout: 10000 });
  return { ...view, seen };
}

const underWay = () =>
  renderQuickCheck(UNDER_WAY, {
    quizzes: { [quizOf(UNDER_WAY)]: aQuizSession(UNDER_WAY, 2, { answered: 1 }) },
  });

const finished = () =>
  renderQuickCheck(FINISHED, {
    quizzes: {
      [quizOf(FINISHED)]: aQuizSession(FINISHED, 2, {
        status: "completed",
        answered: 3,
        wrong: [2],
      }),
    },
  });

type Session = Awaited<ReturnType<typeof renderQuickCheck>>["result"];

/** Presses the one button, and waits for what it does to settle. */
async function pressAction(result: Session) {
  const { act: press, action } = result.current;
  await act(() => press(action));
}

/** Taps a choice — the right one is always a question's first — and waits for the verdict. */
async function tapAnswer(result: Session, which: "right" | "wrong") {
  const choices = result.current.current?.choices ?? [];
  const choice = which === "right" ? choices[0] : choices[1];
  act(() => result.current.pick(choice?.id ?? ""));
  await waitFor(() => expect(result.current.currentResult).not.toBe("unanswered"));
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

describe("useQuickCheckSession", () => {
  it("finds nothing for a day without a Quick Check", async () => {
    const { result } = await renderQuickCheck(NO_QUIZ);

    expect(result.current.found).toBe(false);
  });

  it("finds nothing for a day the plan doesn't have", async () => {
    const { result } = await renderQuickCheck(NOT_STARTED, {}, "6");

    expect(result.current.found).toBe(false);
  });

  it("starts on page 0, offering to start", async () => {
    const { result } = await renderQuickCheck();

    expect(result.current).toMatchObject({
      found: true,
      status: "notStarted",
      page: 0,
      questionCount: 3,
      action: { kind: "start", enabled: true },
    });
  });

  it("starts an attempt on the server, on its first question", async () => {
    const { result, seen } = await renderQuickCheck();

    await pressAction(result);

    expect(seen).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: `/v1/quizzes/${quizOf(NOT_STARTED)}/attempts`,
      }),
    );
    expect(result.current).toMatchObject({ status: "inProgress", page: 1, currentIndex: 0 });
    expect(result.current.current?.prompt).toBe("Question 1?");
  });

  it("won't move on from a question until it's answered", async () => {
    const { result } = await renderQuickCheck();
    await pressAction(result);

    expect(result.current.action).toMatchObject({ kind: "next", enabled: false });
  });

  it("checks an answer the moment it's tapped", async () => {
    const { result, seen } = await renderQuickCheck();
    await pressAction(result);
    const question = result.current.current;

    await tapAnswer(result, "right");

    expect(seen).toContainEqual(
      expect.objectContaining({
        method: "POST",
        body: { questionId: question?.id, choiceId: question?.choices[0]?.id },
      }),
    );
    expect(result.current.currentResult).toBe("correct");
    expect(result.current.action).toMatchObject({ kind: "next", enabled: true });
  });

  it("marks a wrong answer as wrong", async () => {
    const { result } = await renderQuickCheck();
    await pressAction(result);

    await tapAnswer(result, "wrong");

    expect(result.current.currentResult).toBe("incorrect");
  });

  it("checks a question once", async () => {
    const { result, seen } = await renderQuickCheck();
    await pressAction(result);
    await tapAnswer(result, "wrong");

    act(() => result.current.pick(result.current.current?.choices[0]?.id ?? ""));

    expect(seen.filter(({ path }) => path.endsWith("/answers"))).toHaveLength(1);
    expect(result.current.currentResult).toBe("incorrect");
  });

  it("moves on to the next question", async () => {
    const { result } = await renderQuickCheck();
    await pressAction(result);
    await tapAnswer(result, "right");

    await pressAction(result);

    expect(result.current).toMatchObject({ currentIndex: 1, currentResult: "unanswered" });
  });

  it("picks up an attempt under way at its first unanswered question", async () => {
    const { result } = await underWay();

    expect(result.current).toMatchObject({ status: "inProgress", currentIndex: 1 });
  });

  it("scores the attempt on the server after its last question", async () => {
    const { result, seen } = await underWay();
    await tapAnswer(result, "wrong");
    await pressAction(result);
    await tapAnswer(result, "right");
    expect(result.current.action.kind).toBe("finish");

    await pressAction(result);

    expect(seen.some(({ method, path }) => method === "POST" && path.endsWith("/complete"))).toBe(
      true,
    );
    expect(result.current).toMatchObject({
      status: "completed",
      score: { correct: 2, total: 3, percentage: 67 },
    });
  });

  it("opens a finished quiz on its score, with every answer to review", async () => {
    const { result } = await finished();

    expect(result.current).toMatchObject({
      status: "completed",
      score: { correct: 2, total: 3 },
      action: { kind: "done" },
    });
    expect(result.current.review.map(({ result: verdict }) => verdict)).toEqual([
      "correct",
      "incorrect",
      "correct",
    ]);
  });

  it("completes the day and goes on to Day Complete on done, after the score", async () => {
    const { result, seen } = await finished();

    await pressAction(result);

    expect(seen).toContainEqual(
      expect.objectContaining({ method: "POST", path: `/v1/plans/${FINISHED.id}/days/2/complete` }),
    );
    expect(mockReplace).toHaveBeenCalledWith(dayCompleteHref(FINISHED.id, 2));
  });

  it("leaves the whole session on close, without completing the day", async () => {
    const { result, seen } = await renderQuickCheck();

    act(() => result.current.close());

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(seen.filter(({ method }) => method === "POST")).toHaveLength(0);
  });
});

describe("useQuickCheckSession haptics", () => {
  it("taps as the Quick Check is started", async () => {
    const { result } = await renderQuickCheck();

    await pressAction(result);

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives success for a right answer", async () => {
    const { result } = await renderQuickCheck();
    await pressAction(result);

    await tapAnswer(result, "right");

    expect(haptics.successFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.warningFeedback).not.toHaveBeenCalled();
  });

  it("gives a warning for a wrong answer", async () => {
    const { result } = await renderQuickCheck();
    await pressAction(result);

    await tapAnswer(result, "wrong");

    expect(haptics.warningFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });

  it("taps as it moves on, and gives success on finishing", async () => {
    const { result } = await underWay();
    await tapAnswer(result, "right");
    jest.mocked(haptics.successFeedback).mockClear();

    await pressAction(result);
    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);

    await tapAnswer(result, "right");
    jest.mocked(haptics.successFeedback).mockClear();
    await pressAction(result);
    expect(haptics.successFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing as the Quick Check is closed", async () => {
    const { result } = await renderQuickCheck();

    act(() => result.current.close());

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });
});
