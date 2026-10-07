import { render, screen, fireEvent, waitFor, within } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan, aQuizSession } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import type { ApiPlanDetail } from "@/core/api/contracts";
import { dayCompleteHref } from "@/entities/plan";
import { getScoreHeadline } from "@/features/plans/logic/quick-check";
import { QuickCheckScreen } from "@/features/plans/screens/QuickCheckScreen";
import { getFloatingNavBarBottom } from "@/ui/organisms/floatingNavBar";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: () => ({ getParent: () => ({ goBack: mockExitSession }) }),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockExitSession = jest.fn<void, []>();
// These walk a whole quiz or study day through the API; a full parallel run
// can take them past Jest's 5s default.
jest.setTimeout(20_000);

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();

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
/** Day 2's Quick Check finished: two of three right, the second missed. */
const FINISHED = aPlan({
  seed: 1,
  completedDays: 1,
  currentDaySteps: STUDIED,
  quickCheck: { status: "completed", answered: 3, correct: 2 },
});
/** A plan made without Quick Checks. */
const NO_QUIZ = aPlan({ seed: 2, completedDays: 1, quickCheckEnabled: false });

const quizOf = (plan: ApiPlanDetail) => plan.days[1]?.quickCheckId ?? "";

/** Day 2's Quick Check, once it's loaded. */
async function openQuickCheck(
  plan: ApiPlanDetail = NOT_STARTED,
  quizzes: Parameters<typeof servePlans>[1] = {},
) {
  const seen = servePlans([plan], quizzes);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: plan.id, day: "2" });
  render(<QuickCheckScreen />);
  await waitFor(() => expect(screen.queryByTestId("quick-check-content-pending")).toBeNull(), {
    timeout: 10000,
  });
  return seen;
}

/** A Quick Check started, on its first question. */
async function openStarted() {
  const seen = await openQuickCheck();
  press("quick-check-start-button");
  await screen.findByText("Question 1?");
  return seen;
}

const underWay = () =>
  openQuickCheck(UNDER_WAY, {
    quizzes: { [quizOf(UNDER_WAY)]: aQuizSession(UNDER_WAY, 2, { answered: 1 }) },
  });

const finished = () =>
  openQuickCheck(FINISHED, {
    quizzes: {
      [quizOf(FINISHED)]: aQuizSession(FINISHED, 2, {
        status: "completed",
        answered: 3,
        wrong: [2],
      }),
    },
  });

const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));

/** Taps a letter — A is always right — and waits for the verdict. */
async function answer(letter: string) {
  press(`quick-check-choice-${letter}`);
  await screen.findByTestId("quick-check-feedback");
}

beforeEach(() => {
  mockExitSession.mockClear();
  mockReplace.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ replace: mockReplace } as unknown as ReturnType<typeof useRouter>);
});

describe("QuickCheckScreen", () => {
  it("is addressable as quick-check-screen", async () => {
    await openQuickCheck();

    expect(screen.getByTestId("quick-check-screen")).toBeVisible();
  });

  it("shows its shape while the quiz is on its way", () => {
    servePlans([NOT_STARTED]);
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: NOT_STARTED.id, day: "2" });
    render(<QuickCheckScreen />);

    expect(screen.getByTestId("quick-check-content-pending")).toBeOnTheScreen();
  });

  it("says so for a day with no Quick Check, with the way out of the session", async () => {
    await openQuickCheck(NO_QUIZ);

    expect(screen.getByTestId("quick-check-not-found")).toBeVisible();
    fireEvent.press(screen.getByTestId("quick-check-not-found-action"));
    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  describe("its start", () => {
    it("is laid out as a milestone page", async () => {
      await openQuickCheck();

      expect(screen.getByTestId("quick-check-screen-body")).toBeOnTheScreen();
    });

    it("has only a close at its top, no title", async () => {
      await openQuickCheck();

      expect(screen.getByTestId("quick-check-close-button")).toBeVisible();
      expect(screen.queryByText("Quick check")).toBeNull();
    });

    it("heads it with the day's quiz and how many questions", async () => {
      await openQuickCheck();

      expect(screen.getByRole("header", { name: "Day 2 Quiz" })).toBeVisible();
      expect(screen.getByText("3 questions on today's study")).toBeVisible();
    });

    it("offers to start a quiz not yet taken, showing no question", async () => {
      await openQuickCheck();

      expect(screen.getByTestId("quick-check-start-button")).toBeVisible();
      expect(screen.queryByText("Question 1?")).toBeNull();
      expect(screen.queryByTestId("quick-check-progress")).toBeNull();
    });

    it("starts an attempt on its first question", async () => {
      const seen = await openStarted();

      expect(screen.getByText("1 of 3")).toBeVisible();
      expect(seen).toContainEqual(
        expect.objectContaining({
          method: "POST",
          path: `/v1/quizzes/${quizOf(NOT_STARTED)}/attempts`,
        }),
      );
    });
  });

  it("picks up an attempt under way on its unanswered question", async () => {
    await underWay();

    expect(screen.getByText("2 of 3")).toBeVisible();
    expect(screen.getByText("Question 2?")).toBeVisible();
  });

  describe("a question", () => {
    it("shows the question, where it's from, and every choice", async () => {
      await openStarted();

      expect(screen.getByText("From the sermon")).toBeVisible();
      for (const letter of ["a", "b", "c", "d"]) {
        expect(screen.getByTestId(`quick-check-choice-${letter}`)).toBeVisible();
      }
    });

    it("puts its action in the dock, where the tab bar's pill sits", async () => {
      await openStarted();

      const dock = screen.getByTestId("quick-check-screen-dock");
      expect(within(dock).getByTestId("quick-check-next-button")).toBeVisible();
      expect(dock).toHaveStyle({ bottom: getFloatingNavBarBottom(0) });
    });

    it("won't move on until it's answered", async () => {
      await openStarted();

      expect(screen.getByTestId("quick-check-next-button")).toBeDisabled();
    });

    it("says so, and why, when the answer tapped is right", async () => {
      await openStarted();

      await answer("a");

      expect(screen.getByText("That's the one")).toBeVisible();
      expect(screen.getByText(/Why 1 is right/)).toBeVisible();
      expect(screen.getByTestId("quick-check-choice-a")).toHaveProp(
        "accessibilityLabel",
        "A. Answer a to 1. Your answer, right.",
      );
    });

    it("says so, and shows the right answer, when the answer tapped is wrong", async () => {
      await openStarted();

      await answer("b");

      expect(screen.getByText("Not quite")).toBeVisible();
      expect(screen.getByTestId("quick-check-choice-b")).toHaveProp(
        "accessibilityLabel",
        "B. Answer b to 1. Your answer, not right.",
      );
      expect(screen.getByTestId("quick-check-choice-a")).toHaveProp(
        "accessibilityLabel",
        "A. Answer a to 1. The right answer.",
      );
    });

    it("can't be answered twice", async () => {
      const seen = await openStarted();
      await answer("b");

      press("quick-check-choice-a");

      expect(seen.filter(({ path }) => path.endsWith("/answers"))).toHaveLength(1);
    });

    it("moves on to the next question", async () => {
      await openStarted();
      await answer("a");

      press("quick-check-next-button");

      expect(await screen.findByText("Question 2?")).toBeVisible();
      expect(screen.getByText("2 of 3")).toBeVisible();
    });
  });

  describe("completing", () => {
    /** Answers the rest of the attempt under way, and sees the score. */
    async function finishWith(second: string, third: string) {
      await answer(second);
      press("quick-check-next-button");
      await screen.findByText("Question 3?");
      await answer(third);
      press("quick-check-finish-button");
      await screen.findByTestId("quick-check-results");
    }

    it("scores a perfect run", async () => {
      await underWay();

      await finishWith("a", "a");

      expect(screen.getByText("3/3")).toBeVisible();
      expect(screen.getByText("You know this one")).toBeVisible();
      expect(screen.getByText("100% right")).toBeVisible();
    });

    it("scores a run with a wrong answer, and reviews which one", async () => {
      await underWay();

      await finishWith("b", "a");

      expect(screen.getByText("2/3")).toBeVisible();
      expect(screen.getByText("67% right")).toBeVisible();
      const [, second] = UNDER_WAY_QUESTIONS;
      expect(
        within(screen.getByTestId(`quick-check-results-question-${second}`)).getByText("Missed"),
      ).toBeVisible();
    });

    it("opens a quiz already finished on its results", async () => {
      await finished();

      expect(screen.getByTestId("quick-check-results")).toBeVisible();
      expect(screen.getByText("2/3")).toBeVisible();
    });

    it("lays its results out as a milestone page", async () => {
      await finished();

      expect(screen.getByTestId("quick-check-screen-body")).toBeOnTheScreen();
      expect(
        screen.getByRole("header", { name: getScoreHeadline({ correct: 2, total: 3 }) }),
      ).toBeVisible();
    });
  });

  describe("leaving", () => {
    it("leaves the session when Close is pressed, the day not done", async () => {
      await openQuickCheck();

      press("quick-check-close-button");

      expect(mockExitSession).toHaveBeenCalledTimes(1);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("goes on to Day Complete when Done is pressed on the score", async () => {
      await finished();

      press("quick-check-done-button");

      await waitFor(() =>
        expect(mockReplace).toHaveBeenCalledWith(dayCompleteHref(FINISHED.id, 2)),
      );
    });
  });
});

/** The ids of the quiz's questions, in order. */
const UNDER_WAY_QUESTIONS = aQuizSession(UNDER_WAY, 2).quiz.questions.map(({ id }) => id);
