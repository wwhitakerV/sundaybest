import type { ExamAnswerKey } from "@/features/exams/types";
import { isResponseCorrect } from "@/features/exams/logic/grade-response";

const SINGLE_CHOICE_KEY: ExamAnswerKey = { kind: "single_choice", choiceId: "D" };
const TRUE_FALSE_KEY: ExamAnswerKey = { kind: "true_false", choiceId: "T" };
const MULTIPLE_SELECT_KEY: ExamAnswerKey = { kind: "multiple_select", choiceIds: ["A", "B", "C"] };
const MATCHING_KEY: ExamAnswerKey = {
  kind: "matching",
  pairs: [
    { promptId: "P1", targetId: "R1" },
    { promptId: "P2", targetId: "R2" },
    { promptId: "P3", targetId: "R3" },
  ],
};
const ORDERING_KEY: ExamAnswerKey = { kind: "ordering", stepIds: ["S1", "S2", "S3", "S4"] };

describe("isResponseCorrect: single choice and true/false (exact id)", () => {
  it("marks single_choice correct when the response matches the key", () => {
    expect(isResponseCorrect(SINGLE_CHOICE_KEY, { kind: "single_choice", choiceId: "D" })).toBe(
      true,
    );
  });

  it("marks single_choice incorrect when the response differs from the key", () => {
    expect(isResponseCorrect(SINGLE_CHOICE_KEY, { kind: "single_choice", choiceId: "A" })).toBe(
      false,
    );
  });

  it("marks true_false correct when the response matches the key", () => {
    expect(isResponseCorrect(TRUE_FALSE_KEY, { kind: "true_false", choiceId: "T" })).toBe(true);
  });

  it("marks true_false incorrect when the response differs from the key", () => {
    expect(isResponseCorrect(TRUE_FALSE_KEY, { kind: "true_false", choiceId: "F" })).toBe(false);
  });
});

describe("isResponseCorrect: multiple select (exact set, order-insensitive)", () => {
  it("marks multiple_select correct for an exact set match", () => {
    expect(
      isResponseCorrect(MULTIPLE_SELECT_KEY, {
        kind: "multiple_select",
        choiceIds: ["A", "B", "C"],
      }),
    ).toBe(true);
  });

  it("marks multiple_select incorrect for a subset of the key", () => {
    expect(
      isResponseCorrect(MULTIPLE_SELECT_KEY, { kind: "multiple_select", choiceIds: ["A", "B"] }),
    ).toBe(false);
  });

  it("marks multiple_select incorrect for a superset of the key", () => {
    expect(
      isResponseCorrect(MULTIPLE_SELECT_KEY, {
        kind: "multiple_select",
        choiceIds: ["A", "B", "C", "D"],
      }),
    ).toBe(false);
  });

  it("marks multiple_select incorrect for a different same-size set", () => {
    expect(
      isResponseCorrect(MULTIPLE_SELECT_KEY, {
        kind: "multiple_select",
        choiceIds: ["A", "B", "D"],
      }),
    ).toBe(false);
  });

  it("ignores the order choiceIds were selected in (criterion 14)", () => {
    expect(
      isResponseCorrect(MULTIPLE_SELECT_KEY, {
        kind: "multiple_select",
        choiceIds: ["C", "A", "B"],
      }),
    ).toBe(true);
  });
});

describe("isResponseCorrect: matching (exact mapping, pair order irrelevant)", () => {
  it("marks matching correct for an exact pairing", () => {
    expect(
      isResponseCorrect(MATCHING_KEY, {
        kind: "matching",
        pairs: [
          { promptId: "P1", targetId: "R1" },
          { promptId: "P2", targetId: "R2" },
          { promptId: "P3", targetId: "R3" },
        ],
      }),
    ).toBe(true);
  });

  it("marks matching incorrect for a partial pairing", () => {
    expect(
      isResponseCorrect(MATCHING_KEY, {
        kind: "matching",
        pairs: [
          { promptId: "P1", targetId: "R1" },
          { promptId: "P2", targetId: "R2" },
        ],
      }),
    ).toBe(false);
  });

  it("ignores the order pairs appear in (criterion 14)", () => {
    expect(
      isResponseCorrect(MATCHING_KEY, {
        kind: "matching",
        pairs: [
          { promptId: "P3", targetId: "R3" },
          { promptId: "P1", targetId: "R1" },
          { promptId: "P2", targetId: "R2" },
        ],
      }),
    ).toBe(true);
  });
});

describe("isResponseCorrect: ordering (exact sequence)", () => {
  it("marks ordering correct for the exact sequence", () => {
    expect(
      isResponseCorrect(ORDERING_KEY, { kind: "ordering", stepIds: ["S1", "S2", "S3", "S4"] }),
    ).toBe(true);
  });

  it("marks ordering incorrect for a partial or reordered sequence", () => {
    expect(
      isResponseCorrect(ORDERING_KEY, { kind: "ordering", stepIds: ["S2", "S1", "S3", "S4"] }),
    ).toBe(false);
  });
});

describe("isResponseCorrect: no partial credit boundaries", () => {
  it("treats a null response as incorrect", () => {
    expect(isResponseCorrect(SINGLE_CHOICE_KEY, null)).toBe(false);
  });

  it("treats a response of a different kind than the key as incorrect", () => {
    expect(isResponseCorrect(MULTIPLE_SELECT_KEY, { kind: "single_choice", choiceId: "A" })).toBe(
      false,
    );
  });
});
