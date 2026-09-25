import { Pressable } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import {
  INITIAL_STATE,
  getDayMinutes,
  getQuizAttempt,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { ProgressScreen } from "@/features/progress/screens/ProgressScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

// The mock history, with "today" Wednesday 23 September 2026: the active
// plan's day 1 done yesterday (Tue 22), day 2 open today; a seven-day plan
// done every day from Sun 30 Aug to Sat 5 Sep; day 1's Quick Check 1 of 2.
const ACTIVE = "plan-choose-whom-you-will-serve";
const REST_QUIZ = "plan-come-to-me-and-rest-quiz";

/** Stand-ins for finishing a day, and taking a quiz, elsewhere in the app. */
function Elsewhere() {
  const actions = useStoreActions();
  const attempt = useAppSelector((state) => getQuizAttempt(state, REST_QUIZ));
  const attemptId = attempt?.id ?? "";
  return (
    <>
      <Pressable testID="finish-day" onPress={() => actions.completePlanDay(`${ACTIVE}-day-2`)} />
      <Pressable testID="quiz-start" onPress={() => actions.startQuizAttempt(REST_QUIZ)} />
      <Pressable
        testID="quiz-answer-b"
        onPress={() => {
          actions.selectQuizAnswer(attemptId, `${attempt?.currentQuestionId ?? ""}-b`);
          actions.submitQuizAnswer(attemptId);
        }}
      />
      <Pressable testID="quiz-next" onPress={() => actions.moveToNextQuestion(attemptId)} />
      <Pressable testID="quiz-finish" onPress={() => actions.completeQuizAttempt(attemptId)} />
    </>
  );
}

function renderProgress() {
  return render(
    <>
      <ProgressScreen />
      <Elsewhere />
    </>,
  );
}

const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("ProgressScreen", () => {
  it("is addressable as progress-screen", () => {
    renderProgress();

    expect(screen.getByTestId("progress-screen")).toBeVisible();
  });

  it("shows the title", () => {
    renderProgress();

    expect(screen.getByText("Progress")).toBeVisible();
  });

  it("navigates to Settings when the account icon is pressed", () => {
    renderProgress();

    press("progress-account-button");

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
  });

  describe("the week", () => {
    it("opens on this week", () => {
      renderProgress();

      expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 20–26");
    });

    it("marks the days something was finished, and today", () => {
      renderProgress();

      expect(screen.getByTestId("progress-day-2026-09-22")).toHaveProp(
        "accessibilityLabel",
        "Tue, Sep 22: studied",
      );
      expect(screen.getByTestId("progress-day-2026-09-23")).toHaveProp(
        "accessibilityLabel",
        "Today, Sep 23: not yet",
      );
      expect(screen.getByTestId("progress-day-2026-09-21")).toHaveProp(
        "accessibilityLabel",
        "Mon, Sep 21: not studied",
      );
    });

    it("steps back a week at a time through the history", () => {
      renderProgress();

      press("progress-week-previous");
      expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 13–19");
      expect(screen.getByTestId("progress-day-2026-09-15")).toHaveProp(
        "accessibilityLabel",
        "Tue, Sep 15: not studied",
      );

      press("progress-week-previous");
      press("progress-week-previous");
      expect(screen.getByTestId("progress-week-title")).toHaveTextContent("Aug 30 – Sep 5");
      for (const date of ["2026-08-30", "2026-09-02", "2026-09-05"]) {
        expect(screen.getByTestId(`progress-day-${date}`).props.accessibilityLabel).toMatch(
          /: studied$/,
        );
      }
    });

    it("steps forward again", () => {
      renderProgress();

      press("progress-week-previous");
      press("progress-week-next");

      expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 20–26");
    });
  });

  describe("up next", () => {
    it("names the day to study next, and when", () => {
      renderProgress();

      expect(screen.getByTestId("progress-up-next")).toHaveTextContent("Up next Today, Sep 23");
    });

    it("shows the plan under way: its day, time, how far through, and the reminder", () => {
      renderProgress();
      const minutes = getDayMinutes(INITIAL_STATE, `${ACTIVE}-day-2`);

      const card = screen.getByTestId("progress-active-plan");
      expect(card).toHaveTextContent(/Choose Whom You Will Serve/);
      expect(card).toHaveTextContent(`Day 2, ${minutes} min`, { exact: false });
      expect(card).toHaveTextContent(/17%/);
      expect(card).toHaveTextContent(/6:30 AM/);
    });

    it("opens the plan under way", () => {
      renderProgress();

      press("progress-active-plan");

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/(tabs)/plans/[planId]",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
          params: expect.objectContaining({ planId: ACTIVE }),
        }),
      );
    });
  });

  describe("the totals", () => {
    it("shows the streak, every day done, and the latest quiz score", () => {
      renderProgress();

      expect(screen.getByTestId("progress-stat-streak")).toHaveTextContent("1Day streak");
      expect(screen.getByTestId("progress-stat-days")).toHaveTextContent("8Days done");
      expect(screen.getByTestId("progress-stat-quiz")).toHaveTextContent("1/2Quiz score");
    });

    it("counts the plans finished", () => {
      renderProgress();

      expect(screen.getByTestId("progress-plans-done")).toHaveTextContent("1 plan finished");
    });
  });

  describe("as things are finished", () => {
    it("moves on the moment a day is finished", () => {
      renderProgress();

      press("finish-day");

      expect(screen.getByTestId("progress-day-2026-09-23")).toHaveProp(
        "accessibilityLabel",
        "Today, Sep 23: studied",
      );
      expect(screen.getByTestId("progress-stat-streak")).toHaveTextContent("2Day streak");
      expect(screen.getByTestId("progress-stat-days")).toHaveTextContent("9Days done");
      expect(screen.getByTestId("progress-up-next")).toHaveTextContent("Up next Tomorrow, Sep 24");
      expect(screen.getByTestId("progress-active-plan")).toHaveTextContent(/33%/);
    });

    it("shows a quiz's score the moment it's finished", () => {
      renderProgress();

      press("quiz-start");
      press("quiz-answer-b");
      press("quiz-next");
      press("quiz-answer-b");
      press("quiz-finish");

      expect(screen.getByTestId("progress-stat-quiz")).toHaveTextContent("2/2Quiz score");
    });
  });
});
