import { describeQuizReview, tallyQuizReview } from "@/features/plans/logic/quick-check-review";
import type { QuickCheckAnswerView, QuickCheckQuestionView } from "@/features/plans/types";

const CHOICES = [
  { id: "a", label: "A", text: "Grace" },
  { id: "b", label: "B", text: "Law" },
];

function question(overrides: Partial<QuickCheckQuestionView> = {}): QuickCheckQuestionView {
  return {
    id: "q1",
    order: 1,
    kind: "multipleChoice",
    source: "sermon",
    prompt: "What comes before obedience?",
    choices: CHOICES,
    scriptureReference: null,
    correctChoiceId: "a",
    explanation: "The sermon puts grace first.",
    ...overrides,
  };
}

function answer(overrides: Partial<QuickCheckAnswerView> = {}): QuickCheckAnswerView {
  return {
    answerId: "ans1",
    questionId: "q1",
    choiceId: "a",
    correct: true,
    correctChoiceId: "a",
    explanation: "The sermon puts grace first.",
    scriptureReference: null,
    answeredAt: "2026-10-06T12:00:00.000Z",
    ...overrides,
  };
}

describe("describeQuizReview", () => {
  it("numbers each question and says where it's from", () => {
    const [item] = describeQuizReview([question()], [answer()]);

    expect(item).toMatchObject({ number: "01", kicker: "From the sermon" });
  });

  it("shows a right answer as yours, with no correction", () => {
    const [item] = describeQuizReview([question()], [answer()]);

    expect(item).toMatchObject({ result: "correct", yours: "Grace", rightAnswer: null });
  });

  it("shows a missed answer beside the right one", () => {
    const [item] = describeQuizReview([question()], [answer({ choiceId: "b", correct: false })]);

    expect(item).toMatchObject({ result: "incorrect", yours: "Law", rightAnswer: "Grace" });
  });

  it("gives the reason with its Scripture reference first", () => {
    const [item] = describeQuizReview(
      [question()],
      [answer({ scriptureReference: "Ephesians 2:8" })],
    );

    expect(item?.why).toBe("Ephesians 2:8. The sermon puts grace first.");
  });

  it("sets a verse to finish with its right word in the blank", () => {
    const [item] = describeQuizReview(
      [question({ kind: "finishTheVerse", prompt: "For by ___ you have been saved." })],
      [answer({ choiceId: "b", correct: false })],
    );

    expect(item?.verse).toEqual({
      before: "For by ",
      answer: "Grace",
      after: " you have been saved.",
    });
  });

  it("marks a question never answered as such", () => {
    const [item] = describeQuizReview([question()], []);

    expect(item).toMatchObject({ result: "unanswered", yours: null, rightAnswer: null, why: null });
  });
});

describe("tallyQuizReview", () => {
  it("counts the right answers and the missed ones", () => {
    const items = describeQuizReview(
      [question(), question({ id: "q2", order: 2 })],
      [answer(), answer({ questionId: "q2", choiceId: "b", correct: false })],
    );

    expect(tallyQuizReview(items)).toEqual({ right: 1, missed: 1 });
  });
});
