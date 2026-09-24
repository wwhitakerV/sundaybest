import { Text } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import {
  AppStoreProvider,
  INITIAL_STATE,
  appReducer,
  getAttemptAnswers,
  getQuizAttempt,
  getQuizScore,
  useAppSelector,
  type AppState,
} from "@/core/store";
import { QuickCheckScreen } from "@/features/plans/screens/QuickCheckScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockDismissTo = jest.fn<void, [ExpoRouter.Href]>();

// One day, and a two-question Quick Check not yet taken — B is right both times.
const REST = "plan-come-to-me-and-rest";
const REST_QUIZ = `${REST}-quiz`;
// Six days. Day 1's Quick Check is done (one right, one wrong); day 2's is
// under way — its first question answered, the second (finish the verse) on
// screen with a choice picked.
const ACTIVE = "plan-choose-whom-you-will-serve";

/** The store with the Rest plan's Quick Check started. */
const STARTED: AppState = appReducer(INITIAL_STATE, {
  type: "quiz/startAttempt",
  quizId: REST_QUIZ,
  attemptId: "attempt-test",
  at: "2026-09-23T07:00:00.000Z",
});

/** Where the store has a quiz's latest attempt: its status, answers, and score. */
function AttemptProbe({ quizId }: { quizId: string }) {
  const summary = useAppSelector((state) => {
    const attempt = getQuizAttempt(state, quizId);
    if (!attempt) return "no attempt";
    const score = getQuizScore(state, attempt.id);
    const answers = getAttemptAnswers(state, attempt.id).length;
    return `${attempt.status}, ${answers} answers, ${score?.correct ?? 0} right`;
  });
  return <Text testID="attempt-probe">{summary}</Text>;
}

function quickCheckTree(planId: string, day: number, state: AppState, open = true) {
  const quizId = planId === REST ? REST_QUIZ : `${planId}-day-${day}-quiz`;
  return (
    <AppStoreProvider initialState={state}>
      {open && <QuickCheckScreen />}
      <AttemptProbe quizId={quizId} />
    </AppStoreProvider>
  );
}

function renderQuickCheck(planId: string, day: number, state: AppState = INITIAL_STATE) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId, day: String(day) });
  return render(quickCheckTree(planId, day, state));
}

const pick = (letter: string) =>
  fireEvent.press(screen.getByTestId(`quick-check-choice-${letter.toLowerCase()}`));
const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));

/** Picks a letter, checks it, and waits for the verdict. */
async function answer(letter: string) {
  pick(letter);
  press("quick-check-check-button");
  await screen.findByTestId("quick-check-feedback");
}

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush, dismissTo: mockDismissTo } as unknown as ReturnType<
      typeof useRouter
    >);
});

describe("QuickCheckScreen", () => {
  it("is addressable as quick-check-screen", () => {
    renderQuickCheck(REST, 1, STARTED);

    expect(screen.getByTestId("quick-check-screen")).toBeVisible();
  });

  it("shows nothing for a day with no Quick Check", () => {
    renderQuickCheck("plan-faith-through-the-storm", 1);

    expect(screen.queryByTestId("quick-check-screen")).toBeNull();
  });

  describe("not started", () => {
    it("offers to start a quiz not yet taken", () => {
      renderQuickCheck(REST, 1);

      expect(screen.getByTestId("quick-check-start-button")).toBeVisible();
      expect(screen.getByTestId("attempt-probe")).toHaveTextContent("no attempt");
    });

    it("starts an attempt on its first question", async () => {
      renderQuickCheck(REST, 1);

      press("quick-check-start-button");

      expect(await screen.findByText("Who does Jesus invite in Matthew 11:28?")).toBeVisible();
      expect(screen.getByText("1 of 2")).toBeVisible();
      expect(screen.getByTestId("attempt-probe")).toHaveTextContent(
        "inProgress, 0 answers, 0 right",
      );
    });
  });

  describe("resuming", () => {
    it("picks up an attempt under way on its unanswered question, the choice still picked", () => {
      renderQuickCheck(ACTIVE, 2);

      expect(screen.getByText("2 of 3")).toBeVisible();
      expect(screen.getByText("Finish the verse")).toBeVisible();
      expect(screen.getByTestId("quick-check-choice-a")).toBeSelected();
      // The picked words fill the verse's blank.
      expect(screen.getByTestId("quick-check-verse")).toHaveTextContent(
        /it is the reward of the faithful\./,
      );
    });
  });

  describe("a question", () => {
    it("shows the question, where it's from, and every choice", () => {
      renderQuickCheck(REST, 1, STARTED);

      expect(screen.getByText("From Scripture")).toBeVisible();
      expect(screen.getByText("Who does Jesus invite in Matthew 11:28?")).toBeVisible();
      for (const letter of ["a", "b", "c", "d"]) {
        expect(screen.getByTestId(`quick-check-choice-${letter}`)).toBeVisible();
      }
    });

    it("won't check an answer until one is picked", () => {
      renderQuickCheck(REST, 1, STARTED);

      expect(screen.getByTestId("quick-check-check-button")).toBeDisabled();
    });

    it("holds one choice at a time", () => {
      renderQuickCheck(REST, 1, STARTED);

      pick("a");
      pick("c");

      expect(screen.getByTestId("quick-check-choice-c")).toBeSelected();
      expect(screen.getByTestId("quick-check-choice-a")).not.toBeSelected();
    });

    it("says so, and why, when the answer is right", async () => {
      renderQuickCheck(REST, 1, STARTED);

      await answer("b");

      expect(screen.getByText("That's the one")).toBeVisible();
      expect(
        screen.getByText(/all you who are weary and burdened, and I will give you rest/),
      ).toBeVisible();
      expect(screen.getByTestId("quick-check-choice-b")).toHaveProp(
        "accessibilityLabel",
        "B. All who are weary and burdened. Your answer, right.",
      );
    });

    it("says so, shows the right answer, and why, when the answer is wrong", async () => {
      renderQuickCheck(REST, 1, STARTED);

      await answer("a");

      expect(screen.getByText("Not quite")).toBeVisible();
      expect(screen.getByTestId("quick-check-choice-a")).toHaveProp(
        "accessibilityLabel",
        "A. Those who have it all together. Your answer, not right.",
      );
      expect(screen.getByTestId("quick-check-choice-b")).toHaveProp(
        "accessibilityLabel",
        "B. All who are weary and burdened. The right answer.",
      );
    });

    it("can't be answered twice", async () => {
      renderQuickCheck(REST, 1, STARTED);
      await answer("a");

      pick("b");

      expect(screen.getByTestId("attempt-probe")).toHaveTextContent(
        "inProgress, 1 answers, 0 right",
      );
    });

    it("moves on to the next question", async () => {
      renderQuickCheck(REST, 1, STARTED);
      await answer("b");

      press("quick-check-next-button");

      expect(await screen.findByText("According to the sermon, what is a yoke?")).toBeVisible();
      expect(screen.getByText("2 of 2")).toBeVisible();
    });
  });

  describe("completing", () => {
    async function takeQuiz(first: string, second: string) {
      await answer(first);
      press("quick-check-next-button");
      await screen.findByText("According to the sermon, what is a yoke?");
      await answer(second);
      press("quick-check-finish-button");
      await screen.findByTestId("quick-check-score");
    }

    it("scores a perfect run", async () => {
      renderQuickCheck(REST, 1, STARTED);

      await takeQuiz("b", "b");

      expect(screen.getByText("2/2")).toBeVisible();
      expect(screen.getByText("You know this one")).toBeVisible();
      expect(screen.getByText("100% right")).toBeVisible();
      expect(screen.getByTestId("attempt-probe")).toHaveTextContent(
        "completed, 2 answers, 2 right",
      );
    });

    it("scores a run with a wrong answer, and marks which one", async () => {
      renderQuickCheck(REST, 1, STARTED);

      await takeQuiz("a", "b");

      expect(screen.getByText("1/2")).toBeVisible();
      expect(screen.getByText("50% right")).toBeVisible();
      expect(screen.getByTestId("quick-check-result-1")).toHaveProp(
        "accessibilityLabel",
        "Who does Jesus invite in Matthew 11:28? Not right.",
      );
      expect(screen.getByTestId("quick-check-result-2")).toHaveProp(
        "accessibilityLabel",
        "According to the sermon, what is a yoke? Right.",
      );
      expect(screen.getByTestId("attempt-probe")).toHaveTextContent(
        "completed, 2 answers, 1 right",
      );
    });

    it("keeps the finished attempt's answers, to look back on", async () => {
      const view = renderQuickCheck(REST, 1, STARTED);
      await takeQuiz("a", "b");

      view.rerender(quickCheckTree(REST, 1, STARTED, false));
      view.rerender(quickCheckTree(REST, 1, STARTED, true));

      expect(screen.getByText("1/2")).toBeVisible();
      expect(screen.getByTestId("quick-check-result-1")).toHaveProp(
        "accessibilityLabel",
        "Who does Jesus invite in Matthew 11:28? Not right.",
      );
    });

    it("opens a quiz already finished on its results", () => {
      renderQuickCheck(ACTIVE, 1);

      expect(screen.getByTestId("quick-check-score")).toBeVisible();
      expect(screen.getByText("1/2")).toBeVisible();
    });
  });

  describe("leaving", () => {
    function dayCompleteRoute(planId: string, day: string): unknown {
      return expect.objectContaining({
        pathname: "/study/[planId]/day-complete",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId, day }),
      });
    }

    it("returns to Day Complete when Close is pressed", () => {
      renderQuickCheck(REST, 1, STARTED);

      press("quick-check-close-button");

      expect(mockDismissTo).toHaveBeenCalledWith(dayCompleteRoute(REST, "1"));
    });

    it("returns to Day Complete when Done is pressed on the score", () => {
      renderQuickCheck(ACTIVE, 1);

      press("quick-check-done-button");

      expect(mockDismissTo).toHaveBeenCalledWith(dayCompleteRoute(ACTIVE, "1"));
    });
  });
});
