import {
  getChoiceLook,
  getQuestionKicker,
  getQuickCheckPage,
  getQuickCheckAction,
  getResumeIndex,
  getScoreHeadline,
  splitVersePrompt,
  verseBlank,
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
        isLastQuestion: false,
      }),
    ).toEqual({
      kind: "start",
      label: "Start",
      testID: "quick-check-start-button",
      enabled: true,
    });
  });

  it("waits for an answer before moving on — no separate check", () => {
    expect(
      getQuickCheckAction({ status: "inProgress", result: "unanswered", isLastQuestion: false }),
    ).toEqual({
      kind: "next",
      label: "Next question",
      testID: "quick-check-next-button",
      enabled: false,
    });
  });

  it("waits for the last answer before the score", () => {
    expect(
      getQuickCheckAction({ status: "inProgress", result: "unanswered", isLastQuestion: true }),
    ).toMatchObject({ kind: "finish", label: "See your score", enabled: false });
  });

  it("moves on once a question is checked, right or wrong", () => {
    for (const result of ["correct", "incorrect"] as const) {
      expect(
        getQuickCheckAction({
          status: "inProgress",
          result,
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
        isLastQuestion: true,
      }),
    ).toMatchObject({ kind: "finish", label: "See your score" });
  });

  it("is done once the quiz is complete", () => {
    expect(
      getQuickCheckAction({
        status: "completed",
        result: "unanswered",
        isLastQuestion: true,
      }),
    ).toMatchObject({ kind: "done", label: "Done", testID: "quick-check-done-button" });
  });
});

describe("getResumeIndex", () => {
  it("opens a fresh attempt on its first question", () => {
    expect(getResumeIndex(["q1", "q2", "q3"], [])).toBe(0);
  });

  it("picks up an attempt on its first unanswered question", () => {
    expect(getResumeIndex(["q1", "q2", "q3"], ["q1", "q2"])).toBe(2);
  });

  it("stays on the last question once every one is answered", () => {
    expect(getResumeIndex(["q1", "q2"], ["q1", "q2"])).toBe(1);
  });
});

describe("verseBlank", () => {
  it("draws the blank as a line before a word fills it, never as spaces iOS won't underline", () => {
    const blank = verseBlank(null);
    expect(blank.length).toBeGreaterThan(0);
    expect(blank).not.toMatch(/\s/);
  });

  it("is the picked word once there is one", () => {
    expect(verseBlank("eternal life")).toBe("eternal life");
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
  it("finds a blank of any length", () => {
    expect(splitVersePrompt("For God so loved the _____.")).toEqual({
      before: "For God so loved the ",
      after: ".",
    });
  });

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

describe("getQuickCheckPage", () => {
  it("is the start page, 0, before the quiz is begun", () => {
    expect(getQuickCheckPage({ status: "notStarted", currentIndex: -1, questionCount: 3 })).toBe(0);
  });

  it("is the question's position, from 1, while in progress", () => {
    expect(getQuickCheckPage({ status: "inProgress", currentIndex: 0, questionCount: 3 })).toBe(1);
    expect(getQuickCheckPage({ status: "inProgress", currentIndex: 2, questionCount: 3 })).toBe(3);
  });

  it("is the score page, one past the last question, once completed", () => {
    expect(getQuickCheckPage({ status: "completed", currentIndex: -1, questionCount: 3 })).toBe(4);
  });
});
