import { theologyExamContent, type TheologyExamContent } from "@tests/factories/exams";

import { parseExamContent } from "@/features/exams/data/parse-exam";

// ---------------------------------------------------------------------------
// Criterion 3 — the supplied exam loads
// ---------------------------------------------------------------------------
describe("parseExamContent: the supplied exam loads (criterion 3)", () => {
  it("parses the real bundled content successfully", () => {
    const result = parseExamContent(theologyExamContent());

    expect(result.ok).toBe(true);
  });

  it("orders questions to match exam.questionIds", () => {
    const content = theologyExamContent();
    const result = parseExamContent(content);
    if (!result.ok) throw new Error("expected the real content to parse");

    expect(result.exam.questions.map((question) => question.id)).toEqual(content.exam.questionIds);
  });

  it("numbers questions 1 through 15 in order", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    expect(result.exam.questions.map((question) => question.number)).toEqual(
      Array.from({ length: 15 }, (_unused, index) => index + 1),
    );
  });

  it("tallies interaction kinds to 8 single choice, 2 true/false, 1 matching, 2 multiple select, 2 ordering", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    const tally = result.exam.questions.reduce<Record<string, number>>((counts, question) => {
      counts[question.kind] = (counts[question.kind] ?? 0) + 1;
      return counts;
    }, {});

    expect(tally).toEqual({
      single_choice: 8,
      true_false: 2,
      matching: 1,
      multiple_select: 2,
      ordering: 2,
    });
  });

  it("builds the exam summary from the exam's own fields", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    expect(result.exam.summary).toMatchObject({
      title: "The Scriptures Received",
      questionCount: 15,
      durationMinutes: [8, 12],
      modeDescriptions: {
        exam: "Answers revealed only after submission.",
        study: "Immediate option-specific teaching; not independent blind mastery evidence.",
      },
    });
    expect(result.exam.summary.sourceLinks).toHaveLength(3);
  });

  it("builds the rules from exam.experience", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    expect(result.exam.rules.bands).toHaveLength(4);
    expect(result.exam.rules.conceptMinimumObservations).toBe(3);
    expect(result.exam.rules.actionLabel).toBe("Understand why");
  });

  it("builds each question's passages from its passageRefs and matching sources", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    const q01 = result.exam.questions.find((question) => question.id === "THEO-01-01-Q01");

    expect(q01?.passages).toEqual([
      {
        reference: "2 Timothy 3:14-15",
        url: "https://www.biblegateway.com/passage/?search=2%20Timothy%203%3A14-15&version=KJV",
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Criterion 4 — content fails closed
// ---------------------------------------------------------------------------
type FailureCase = {
  name: string;
  mutate: (content: TheologyExamContent) => void;
  pathPrefix: string;
};

const FAILURE_CASES: FailureCase[] = [
  {
    name: "a question id is missing from exam.questionIds",
    mutate: (content) => {
      content.exam.questionIds = content.exam.questionIds.filter((id) => id !== "THEO-01-01-Q06");
    },
    pathPrefix: "exam.questionIds",
  },
  {
    name: "questions are out of order with exam.questionIds",
    mutate: (content) => {
      const [first, second] = content.exam.questionIds;
      content.exam.questionIds[0] = second!;
      content.exam.questionIds[1] = first!;
    },
    pathPrefix: "exam.questionIds",
  },
  {
    name: "exam.questionCount doesn't match the questions",
    mutate: (content) => {
      content.exam.questionCount = 14;
    },
    pathPrefix: "exam.questionCount",
  },
  {
    name: "exam.interactionAllocation doesn't match the questions",
    mutate: (content) => {
      content.exam.interactionAllocation.single_choice = 7;
    },
    pathPrefix: "exam.interactionAllocation",
  },
  {
    name: "a question's examId isn't exam.id",
    mutate: (content) => {
      content.questions[2]!.examId = "THEO-99-99";
    },
    pathPrefix: "questions[2].examId",
  },
  {
    name: "two questions share an id",
    mutate: (content) => {
      content.questions[1]!.id = content.questions[0]!.id;
    },
    pathPrefix: "questions[1].id",
  },
  {
    name: "two choices in the same question share an id",
    mutate: (content) => {
      content.questions[0]!.interaction.choices![1]!.id =
        content.questions[0]!.interaction.choices![0]!.id;
    },
    pathPrefix: "questions[0].interaction.choices[1].id",
  },
  {
    name: "the answerKey names a choice that doesn't exist",
    mutate: (content) => {
      content.questions[0]!.interaction.answerKey = "Z";
    },
    pathPrefix: "questions[0].interaction.answerKey",
  },
  {
    name: "a matching key doesn't pair every prompt with a distinct target",
    mutate: (content) => {
      // Q04's real key pairs P1/P2/P3 — drop P3, leaving it unpaired.
      content.questions[3]!.interaction.answerKey = { P1: "R1", P2: "R2" };
    },
    pathPrefix: "questions[3].interaction.answerKey",
  },
  {
    name: "an ordering key isn't a permutation of the steps",
    mutate: (content) => {
      // Q11 has steps S1-S4 — duplicate S3 and drop S4.
      content.questions[10]!.interaction.answerKey = ["S1", "S2", "S3", "S3"];
    },
    pathPrefix: "questions[10].interaction.answerKey",
  },
  {
    name: "a choice has no rationale",
    mutate: (content) => {
      delete content.questions[0]!.interaction.choices![0]!.rationale;
    },
    pathPrefix: "questions[0].interaction.choices[0].rationale",
  },
  {
    name: "matchFeedback is missing an entry for a prompt",
    mutate: (content) => {
      delete content.questions[3]!.teaching.matchFeedback!.P2;
    },
    pathPrefix: "questions[3].teaching.matchFeedback.P2",
  },
  {
    name: "stepFeedback is missing an entry for a step",
    mutate: (content) => {
      delete content.questions[10]!.teaching.stepFeedback!.S2;
    },
    pathPrefix: "questions[10].teaching.stepFeedback.S2",
  },
  {
    name: "whyCorrect is missing",
    mutate: (content) => {
      delete content.questions[4]!.whyCorrect;
    },
    pathPrefix: "questions[4].whyCorrect",
  },
  {
    name: "teaching.rememberThis is missing",
    mutate: (content) => {
      delete content.questions[5]!.teaching.rememberThis;
    },
    pathPrefix: "questions[5].teaching.rememberThis",
  },
  {
    name: "interaction.scoring disagrees with exam.experience.grading",
    mutate: (content) => {
      content.questions[0]!.interaction.scoring = "exact_set";
    },
    pathPrefix: "questions[0].interaction.scoring",
  },
  {
    name: "interaction.kind is unknown",
    mutate: (content) => {
      content.questions[0]!.interaction.kind = "essay";
    },
    pathPrefix: "questions[0].interaction.kind",
  },
  {
    name: "a passageRef has no matching source",
    mutate: (content) => {
      content.questions[0]!.passageRefs.push("Genesis 1:1");
    },
    pathPrefix: "questions[0].passageRefs[1]",
  },
  {
    name: "the bands don't descend to 0",
    mutate: (content) => {
      content.exam.experience.results.bands[3]!.minPercent = 5;
    },
    pathPrefix: "exam.experience.results.bands",
  },
  {
    name: "schemaVersion isn't 2",
    mutate: (content) => {
      content.schemaVersion = 1;
    },
    pathPrefix: "schemaVersion",
  },
];

describe("parseExamContent: content fails closed (criterion 4)", () => {
  it.each(FAILURE_CASES)("reports an issue path when $name", ({ mutate, pathPrefix }) => {
    const content = theologyExamContent();
    mutate(content);

    const result = parseExamContent(content);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((issue) => issue.startsWith(pathPrefix))).toBe(true);
  });

  it("fails closed on a link that isn't https://www.biblegateway.com, without leaking the url", () => {
    const content = theologyExamContent();
    const badUrl =
      "http://www.biblegateway.com/passage/?search=2%20Timothy%203%3A14-15&version=KJV";
    content.questions[0]!.sources[0]!.url = badUrl;

    const result = parseExamContent(content);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((issue) => issue.startsWith("questions[0].sources[0].url"))).toBe(
      true,
    );
    expect(result.issues.some((issue) => issue.includes(badUrl))).toBe(false);
  });

  it("fails closed when the raw content is null", () => {
    const result = parseExamContent(null);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.examId).toBeNull();
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("fails closed when the raw content is a string", () => {
    const result = parseExamContent("not an exam");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.examId).toBeNull();
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Criterion 5 — the question screen never receives a key
// ---------------------------------------------------------------------------
describe("parseExamContent: the question screen never receives a key (criterion 5)", () => {
  it("keeps every secret field out of the parsed exam", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    const serialized = JSON.stringify(result.exam);
    for (const secret of [
      "answerKey",
      "rationale",
      "whyCorrect",
      "teaching",
      "matchFeedback",
      "stepFeedback",
    ]) {
      // As a field name — the word itself can appear in content (a concept
      // named "Scripture in apostolic teaching").
      expect(serialized).not.toContain(`"${secret}":`);
    }
  });

  it("carries Q01's single-choice key in its reveal", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    const reveal = result.reveals.find((entry) => entry.questionId === "THEO-01-01-Q01");

    expect(reveal?.key).toEqual({ kind: "single_choice", choiceId: "D" });
  });

  it("carries Q04's matching key and matchFeedback in its reveal", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    const reveal = result.reveals.find((entry) => entry.questionId === "THEO-01-01-Q04");

    expect(reveal?.key).toEqual({
      kind: "matching",
      pairs: expect.arrayContaining([
        { promptId: "P1", targetId: "R1" },
        { promptId: "P2", targetId: "R2" },
        { promptId: "P3", targetId: "R3" },
      ]) as unknown,
    });
    expect(reveal?.feedback.map((line) => line.optionId).sort()).toEqual(["P1", "P2", "P3"]);
  });

  it("carries Q11's ordering key with stepIds S1..S4 and stepFeedback in its reveal", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    const reveal = result.reveals.find((entry) => entry.questionId === "THEO-01-01-Q11");

    expect(reveal?.key).toEqual({ kind: "ordering", stepIds: ["S1", "S2", "S3", "S4"] });
    expect(reveal?.feedback.map((line) => line.optionId).sort()).toEqual(["S1", "S2", "S3", "S4"]);
  });

  it("carries Q09's multiple-select key with choiceIds A, B, C in its reveal", () => {
    const result = parseExamContent(theologyExamContent());
    if (!result.ok) throw new Error("expected the real content to parse");

    const reveal = result.reveals.find((entry) => entry.questionId === "THEO-01-01-Q09");

    expect(reveal?.key).toEqual({ kind: "multiple_select", choiceIds: ["A", "B", "C"] });
  });
});
