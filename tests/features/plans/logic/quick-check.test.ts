import {
  getChoiceLook,
  getQuestionKicker,
  getQuickCheckAction,
  getScoreHeadline,
  splitVersePrompt,
} from "@/features/plans/logic/quick-check";

describe("getChoiceLook", () => {
  const choice = (choiceId: string, answer: Partial<Parameters<typeof getChoiceLook>[0]> = {}) =>
    getChoiceLook({
      choiceId,
      selectedChoiceId: null,
      answeredChoiceId: null,
      correctChoiceId: "b",
      ...answer,
    });

  it("leaves every choice plain before one is picked", () => {
    expect(choice("a")).toBe("idle");
  });

  it("marks the one picked, not yet checked", () => {
    expect(choice("a", { selectedChoiceId: "a" })).toBe("selected");
    expect(choice("b", { selectedChoiceId: "a" })).toBe("idle");
  });

  it("once checked, shows the right answer as right, whichever was picked", () => {
    expect(choice("b", { answeredChoiceId: "b" })).toBe("correct");
    expect(choice("b", { answeredChoiceId: "a" })).toBe("correct");
  });

  it("once checked, shows a wrong pick as wrong", () => {
    expect(choice("a", { answeredChoiceId: "a" })).toBe("incorrect");
  });

  it("once checked, steps the rest back", () => {
    expect(choice("c", { answeredChoiceId: "a" })).toBe("faded");
  });
});

describe("getQuickCheckAction", () => {
  it("starts a quiz not yet started", () => {
    expect(
      getQuickCheckAction({
        status: "notStarted",
        result: "unanswered",
        hasSelection: false,
        isLastQuestion: false,
      }),
    ).toEqual({
      kind: "start",
      label: "Start",
      testID: "quick-check-start-button",
      enabled: true,
    });
  });

  it("checks the picked answer — only once one is picked", () => {
    const action = (hasSelection: boolean) =>
      getQuickCheckAction({
        status: "inProgress",
        result: "unanswered",
        hasSelection,
        isLastQuestion: false,
      });

    expect(action(false)).toMatchObject({ kind: "check", label: "Check answer", enabled: false });
    expect(action(true)).toMatchObject({ kind: "check", enabled: true });
  });

  it("moves on once a question is checked, right or wrong", () => {
    for (const result of ["correct", "incorrect"] as const) {
      expect(
        getQuickCheckAction({
          status: "inProgress",
          result,
          hasSelection: false,
          isLastQuestion: false,
        }),
      ).toMatchObject({ kind: "next", label: "Next question", enabled: true });
    }
  });

  it("goes to the score after the last question", () => {
    expect(
      getQuickCheckAction({
        status: "inProgress",
        result: "incorrect",
        hasSelection: false,
        isLastQuestion: true,
      }),
    ).toMatchObject({ kind: "finish", label: "See your score" });
  });

  it("is done once the quiz is complete", () => {
    expect(
      getQuickCheckAction({
        status: "completed",
        result: "unanswered",
        hasSelection: false,
        isLastQuestion: true,
      }),
    ).toMatchObject({ kind: "done", label: "Done", testID: "quick-check-done-button" });
  });
});

describe("getQuestionKicker", () => {
  it("says where a question comes from, or that it's a verse to finish", () => {
    expect(getQuestionKicker({ kind: "multipleChoice", source: "sermon" })).toBe("From the sermon");
    expect(getQuestionKicker({ kind: "multipleChoice", source: "scripture" })).toBe(
      "From Scripture",
    );
    expect(getQuestionKicker({ kind: "finishTheVerse", source: "scripture" })).toBe(
      "Finish the verse",
    );
  });
});

describe("splitVersePrompt", () => {
  it("splits a verse around its blank, without the instruction or quote marks", () => {
    expect(
      splitVersePrompt("Finish the verse: “…and this is not from yourselves, it is the ___.”"),
    ).toEqual({ before: "…and this is not from yourselves, it is the ", after: "." });
  });

  it("keeps a verse with no instruction as it is", () => {
    expect(splitVersePrompt("For it is by ___ you have been saved")).toEqual({
      before: "For it is by ",
      after: " you have been saved",
    });
  });

  it("finds nothing to split in a prompt with no blank", () => {
    expect(splitVersePrompt("Who does Jesus invite?")).toBeNull();
  });
});

describe("getScoreHeadline", () => {
  it("celebrates a perfect score", () => {
    expect(getScoreHeadline({ correct: 2, total: 2 })).toBe("You know this one");
  });

  it("encourages a score with most right", () => {
    expect(getScoreHeadline({ correct: 2, total: 3 })).toBe("Nearly there");
  });

  it("invites another look when most were missed", () => {
    expect(getScoreHeadline({ correct: 0, total: 2 })).toBe("Worth another look");
  });
});
