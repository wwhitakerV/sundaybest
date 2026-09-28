import type { ExamOption } from "@/features/exams/types";
import {
  getChoiceFeedback,
  getMatchingFeedback,
  getOrderingFeedback,
} from "@/features/exams/logic/feedback";

// ---------------------------------------------------------------------------
// getChoiceFeedback (criteria 23, 24)
// ---------------------------------------------------------------------------
const SINGLE_CHOICES: ExamOption[] = [
  { id: "A", label: "A written account of every apostle" },
  { id: "B", label: "The completed New Testament canon" },
  { id: "C", label: "Only Paul's letters" },
  { id: "D", label: "The holy Scriptures" },
];
const SINGLE_KEY = { kind: "single_choice" as const, choiceId: "D" };
const SINGLE_FEEDBACK = [
  { optionId: "A", text: "No such collection is named here." },
  { optionId: "B", text: "The passage does not enumerate a completed New Testament collection." },
  { optionId: "C", text: "Paul does not limit the childhood writings to his own letters." },
  { optionId: "D", text: "This is what the passage explicitly says." },
];

describe("getChoiceFeedback: single choice / true-false", () => {
  it("marks the keyed choice correct when it was picked", () => {
    const result = getChoiceFeedback({
      choices: SINGLE_CHOICES,
      response: { kind: "single_choice", choiceId: "D" },
      key: SINGLE_KEY,
      feedback: SINGLE_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "D")).toEqual({
      choiceId: "D",
      state: "correct",
      picked: true,
      rationale: "This is what the passage explicitly says.",
    });
  });

  it("marks the keyed choice correct even when a different choice was picked", () => {
    const result = getChoiceFeedback({
      choices: SINGLE_CHOICES,
      response: { kind: "single_choice", choiceId: "A" },
      key: SINGLE_KEY,
      feedback: SINGLE_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "D")).toEqual({
      choiceId: "D",
      state: "correct",
      picked: false,
      rationale: "This is what the passage explicitly says.",
    });
  });

  it("marks a wrong pick incorrect with its rationale", () => {
    const result = getChoiceFeedback({
      choices: SINGLE_CHOICES,
      response: { kind: "single_choice", choiceId: "A" },
      key: SINGLE_KEY,
      feedback: SINGLE_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "A")).toEqual({
      choiceId: "A",
      state: "incorrect",
      picked: true,
      rationale: "No such collection is named here.",
    });
  });

  it("fades an unpicked, unkeyed choice with no rationale", () => {
    const result = getChoiceFeedback({
      choices: SINGLE_CHOICES,
      response: { kind: "single_choice", choiceId: "D" },
      key: SINGLE_KEY,
      feedback: SINGLE_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "B")).toEqual({
      choiceId: "B",
      state: "faded",
      picked: false,
      rationale: null,
    });
  });

  it("returns choices in their original order", () => {
    const result = getChoiceFeedback({
      choices: SINGLE_CHOICES,
      response: { kind: "single_choice", choiceId: "D" },
      key: SINGLE_KEY,
      feedback: SINGLE_FEEDBACK,
    });

    expect(result.map((entry) => entry.choiceId)).toEqual(["A", "B", "C", "D"]);
  });
});

const MULTI_CHOICES: ExamOption[] = [
  { id: "A", label: "Correction" },
  { id: "B", label: "Doctrine" },
  { id: "C", label: "Instruction in righteousness" },
  { id: "D", label: "Revealing the date of Christ's return" },
];
const MULTI_KEY = { kind: "multiple_select" as const, choiceIds: ["A", "B", "C"] };
const MULTI_FEEDBACK = [
  { optionId: "A", text: "Correction is listed." },
  { optionId: "B", text: "Doctrine is named in the KJV text." },
  { optionId: "C", text: "Instruction in righteousness is named in the KJV text." },
  { optionId: "D", text: "No such date or function is listed." },
];

describe("getChoiceFeedback: multiple select", () => {
  it("marks a keyed and picked choice correct with no rationale", () => {
    const result = getChoiceFeedback({
      choices: MULTI_CHOICES,
      response: { kind: "multiple_select", choiceIds: ["A", "B"] },
      key: MULTI_KEY,
      feedback: MULTI_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "A")).toEqual({
      choiceId: "A",
      state: "correct",
      picked: true,
      rationale: null,
    });
  });

  it("marks a keyed but missed choice as missed with its rationale", () => {
    const result = getChoiceFeedback({
      choices: MULTI_CHOICES,
      response: { kind: "multiple_select", choiceIds: ["A", "B"] },
      key: MULTI_KEY,
      feedback: MULTI_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "C")).toEqual({
      choiceId: "C",
      state: "missed",
      picked: false,
      rationale: "Instruction in righteousness is named in the KJV text.",
    });
  });

  it("marks an unkeyed but picked choice as incorrect with its rationale", () => {
    const result = getChoiceFeedback({
      choices: MULTI_CHOICES,
      response: { kind: "multiple_select", choiceIds: ["A", "B", "D"] },
      key: MULTI_KEY,
      feedback: MULTI_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "D")).toEqual({
      choiceId: "D",
      state: "incorrect",
      picked: true,
      rationale: "No such date or function is listed.",
    });
  });

  it("fades an unkeyed, unpicked choice with no rationale", () => {
    const result = getChoiceFeedback({
      choices: MULTI_CHOICES,
      response: { kind: "multiple_select", choiceIds: ["A", "B", "C"] },
      key: MULTI_KEY,
      feedback: MULTI_FEEDBACK,
    });

    expect(result.find((entry) => entry.choiceId === "D")).toEqual({
      choiceId: "D",
      state: "faded",
      picked: false,
      rationale: null,
    });
  });
});

// ---------------------------------------------------------------------------
// getMatchingFeedback (criterion 25)
// ---------------------------------------------------------------------------
const PROMPTS: ExamOption[] = [
  { id: "P1", label: "Luke 24:44" },
  { id: "P2", label: "2 Timothy 3:16" },
  { id: "P3", label: "Acts 17:11" },
];
const MATCHING_KEY = {
  kind: "matching" as const,
  pairs: [
    { promptId: "P1", targetId: "R1" },
    { promptId: "P2", targetId: "R2" },
    { promptId: "P3", targetId: "R3" },
  ],
};
const MATCH_FEEDBACK = [
  { optionId: "P1", text: "Jesus names these groupings in Luke 24:44." },
  { optionId: "P2", text: "Correction is among the uses in 2 Timothy 3:16." },
  { optionId: "P3", text: "The Bereans examine the Scriptures daily in Acts 17:11." },
];

describe("getMatchingFeedback", () => {
  it("returns one entry per prompt, in prompt order", () => {
    const result = getMatchingFeedback({
      prompts: PROMPTS,
      response: null,
      key: MATCHING_KEY,
      feedback: MATCH_FEEDBACK,
    });

    expect(result.map((entry) => entry.promptId)).toEqual(["P1", "P2", "P3"]);
  });

  it("marks a pairing right when the picked target matches the key", () => {
    const result = getMatchingFeedback({
      prompts: PROMPTS,
      response: { kind: "matching", pairs: [{ promptId: "P1", targetId: "R1" }] },
      key: MATCHING_KEY,
      feedback: MATCH_FEEDBACK,
    });

    const entry = result.find((item) => item.promptId === "P1");
    expect(entry?.right).toBe(true);
    expect(entry?.correctTargetId).toBe("R1");
    expect(entry?.pickedTargetId).toBe("R1");
  });

  it("marks a pairing wrong when the picked target differs from the key", () => {
    const result = getMatchingFeedback({
      prompts: PROMPTS,
      response: { kind: "matching", pairs: [{ promptId: "P1", targetId: "R2" }] },
      key: MATCHING_KEY,
      feedback: MATCH_FEEDBACK,
    });

    const entry = result.find((item) => item.promptId === "P1");
    expect(entry?.right).toBe(false);
    expect(entry?.pickedTargetId).toBe("R2");
  });

  it("reports pickedTargetId null when the prompt has no pairing yet", () => {
    const result = getMatchingFeedback({
      prompts: PROMPTS,
      response: { kind: "matching", pairs: [] },
      key: MATCHING_KEY,
      feedback: MATCH_FEEDBACK,
    });

    expect(result.find((entry) => entry.promptId === "P1")?.pickedTargetId).toBeNull();
  });

  it("includes the matchFeedback text for the prompt regardless of correctness", () => {
    const result = getMatchingFeedback({
      prompts: PROMPTS,
      response: { kind: "matching", pairs: [{ promptId: "P1", targetId: "R2" }] },
      key: MATCHING_KEY,
      feedback: MATCH_FEEDBACK,
    });

    expect(result.find((entry) => entry.promptId === "P1")?.text).toBe(
      "Jesus names these groupings in Luke 24:44.",
    );
  });
});

// ---------------------------------------------------------------------------
// getOrderingFeedback (criterion 26)
// ---------------------------------------------------------------------------
const ORDERING_KEY = { kind: "ordering" as const, stepIds: ["S1", "S2", "S3", "S4"] };
const STEP_FEEDBACK = [
  { optionId: "S1", text: "Verse 46 first states the Messiah's suffering." },
  { optionId: "S2", text: "Verse 46 then states his rising on the third day." },
  { optionId: "S3", text: "Verse 47 describes the message preached among the nations." },
  { optionId: "S4", text: "Verse 48 calls the disciples witnesses." },
];

describe("getOrderingFeedback", () => {
  it("numbers positions 1-based along the key's sequence, not the steps' display order", () => {
    const result = getOrderingFeedback({
      response: { kind: "ordering", stepIds: [] },
      key: ORDERING_KEY,
      feedback: STEP_FEEDBACK,
    });

    expect(result.map((entry) => [entry.position, entry.stepId])).toEqual([
      [1, "S1"],
      [2, "S2"],
      [3, "S3"],
      [4, "S4"],
    ]);
  });

  it("marks a position right when the picked step matches the key at that position", () => {
    const result = getOrderingFeedback({
      response: { kind: "ordering", stepIds: ["S1", "S2", "S3", "S4"] },
      key: ORDERING_KEY,
      feedback: STEP_FEEDBACK,
    });

    expect(result.every((entry) => entry.right)).toBe(true);
  });

  it("marks a position wrong when the picked step differs from the key", () => {
    const result = getOrderingFeedback({
      response: { kind: "ordering", stepIds: ["S2", "S1", "S3", "S4"] },
      key: ORDERING_KEY,
      feedback: STEP_FEEDBACK,
    });

    expect(result[0]).toMatchObject({
      position: 1,
      stepId: "S1",
      pickedStepId: "S2",
      right: false,
    });
  });

  it("reports pickedStepId null when nothing was placed at that position", () => {
    const result = getOrderingFeedback({
      response: { kind: "ordering", stepIds: ["S1"] },
      key: ORDERING_KEY,
      feedback: STEP_FEEDBACK,
    });

    expect(result[1]?.pickedStepId).toBeNull();
  });

  it("includes the stepFeedback text for the correct step at each position", () => {
    const result = getOrderingFeedback({
      response: { kind: "ordering", stepIds: [] },
      key: ORDERING_KEY,
      feedback: STEP_FEEDBACK,
    });

    expect(result[2]?.text).toBe("Verse 47 describes the message preached among the nations.");
  });
});
