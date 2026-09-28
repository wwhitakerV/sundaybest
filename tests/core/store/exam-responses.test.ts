import {
  getExamItemResponse,
  isExamQuestionRevealed,
  isExamResponseComplete,
  isExamResponseValid,
} from "@/core/store";
import type { ExamAttempt, ExamItemResponse } from "@/types/domain";
import {
  aMatchingItem,
  aMultipleSelectItem,
  anExamAttempt,
  anExamItemResponse,
  anOrderingItem,
  aSingleChoiceItem,
  aTrueFalseItem,
  matchingResponse,
  multipleSelectResponse,
  orderingResponse,
  singleChoiceResponse,
  trueFalseResponse,
} from "@tests/factories/exam-attempts";

// The four pure helpers `src/core/store/exam-responses.ts` is expected to
// export (re-exported by the store index): whether a response is a legal
// shape for its item, whether it's complete enough to check or score, what an
// attempt's latest response to a question is, and whether that question's
// answer has been revealed.

describe("isExamResponseValid", () => {
  it("accepts a single_choice response whose choice belongs to the item", () => {
    expect(isExamResponseValid(aSingleChoiceItem(), singleChoiceResponse("B"))).toBe(true);
  });

  it("refuses a response whose kind differs from the item's kind", () => {
    expect(isExamResponseValid(aSingleChoiceItem(), trueFalseResponse("T"))).toBe(false);
  });

  it("refuses a choice id that does not belong to the item", () => {
    expect(isExamResponseValid(aSingleChoiceItem(), singleChoiceResponse("Z"))).toBe(false);
  });

  it("accepts a multiple_select response with a valid subset of the item's choices", () => {
    expect(isExamResponseValid(aMultipleSelectItem(), multipleSelectResponse(["A"]))).toBe(true);
  });

  it("refuses a multiple_select response with a duplicate choice id", () => {
    expect(isExamResponseValid(aMultipleSelectItem(), multipleSelectResponse(["A", "A"]))).toBe(
      false,
    );
  });

  it("refuses a multiple_select response with a choice id that does not belong to the item", () => {
    expect(isExamResponseValid(aMultipleSelectItem(), multipleSelectResponse(["A", "Z"]))).toBe(
      false,
    );
  });

  it("accepts a matching response that pairs only one of three prompts", () => {
    const response = matchingResponse([{ promptId: "P1", targetId: "R1" }]);
    expect(isExamResponseValid(aMatchingItem(), response)).toBe(true);
  });

  it("refuses a matching response with a prompt id that does not belong to the item", () => {
    const response = matchingResponse([{ promptId: "P-unknown", targetId: "R1" }]);
    expect(isExamResponseValid(aMatchingItem(), response)).toBe(false);
  });

  it("refuses a matching response with a target id that does not belong to the item", () => {
    const response = matchingResponse([{ promptId: "P1", targetId: "R-unknown" }]);
    expect(isExamResponseValid(aMatchingItem(), response)).toBe(false);
  });

  it("refuses a matching response that pairs one target with two prompts", () => {
    const response = matchingResponse([
      { promptId: "P1", targetId: "R1" },
      { promptId: "P2", targetId: "R1" },
    ]);
    expect(isExamResponseValid(aMatchingItem(), response)).toBe(false);
  });

  it("refuses a matching response that pairs the same prompt twice", () => {
    const response = matchingResponse([
      { promptId: "P1", targetId: "R1" },
      { promptId: "P1", targetId: "R2" },
    ]);
    expect(isExamResponseValid(aMatchingItem(), response)).toBe(false);
  });

  it("accepts an ordering response placing only two of four steps", () => {
    expect(isExamResponseValid(anOrderingItem(), orderingResponse(["S1", "S2"]))).toBe(true);
  });

  it("accepts an empty ordering response", () => {
    expect(isExamResponseValid(anOrderingItem(), orderingResponse([]))).toBe(true);
  });

  it("refuses an ordering response with a duplicate step id", () => {
    expect(isExamResponseValid(anOrderingItem(), orderingResponse(["S1", "S1"]))).toBe(false);
  });

  it("refuses an ordering response with a step id that does not belong to the item", () => {
    expect(isExamResponseValid(anOrderingItem(), orderingResponse(["S1", "S-unknown"]))).toBe(
      false,
    );
  });
});

describe("isExamResponseComplete", () => {
  it.each([
    ["single_choice", aSingleChoiceItem(), singleChoiceResponse("A")],
    ["true_false", aTrueFalseItem(), trueFalseResponse("T")],
  ])("is complete for a valid %s response", (_kind, item, response) => {
    expect(isExamResponseComplete(item, response)).toBe(true);
  });

  it("is not complete for a multiple_select response with nothing selected", () => {
    expect(isExamResponseComplete(aMultipleSelectItem(), multipleSelectResponse([]))).toBe(false);
  });

  it("is complete for a multiple_select response with at least one choice selected", () => {
    expect(isExamResponseComplete(aMultipleSelectItem(), multipleSelectResponse(["A"]))).toBe(true);
  });

  it("is not complete for a matching response until every prompt is paired", () => {
    const response = matchingResponse([{ promptId: "P1", targetId: "R1" }]);
    expect(isExamResponseComplete(aMatchingItem(), response)).toBe(false);
  });

  it("is complete for a matching response once every prompt is paired", () => {
    const response = matchingResponse([
      { promptId: "P1", targetId: "R1" },
      { promptId: "P2", targetId: "R2" },
      { promptId: "P3", targetId: "R3" },
    ]);
    expect(isExamResponseComplete(aMatchingItem(), response)).toBe(true);
  });

  it("is not complete for an ordering response until every step is placed", () => {
    expect(isExamResponseComplete(anOrderingItem(), orderingResponse(["S1", "S2"]))).toBe(false);
  });

  it("is complete for an ordering response once every step is placed", () => {
    const response = orderingResponse(["S1", "S2", "S3", "S4"]);
    expect(isExamResponseComplete(anOrderingItem(), response)).toBe(true);
  });

  it("is not complete for a null response", () => {
    expect(isExamResponseComplete(aSingleChoiceItem(), null)).toBe(false);
  });

  it("is not complete for an undefined response", () => {
    expect(isExamResponseComplete(aSingleChoiceItem(), undefined)).toBe(false);
  });
});

describe("getExamItemResponse", () => {
  it("returns the response recorded for that question", () => {
    const response: ExamItemResponse = anExamItemResponse({ questionId: "q-single-choice" });
    const attempt: ExamAttempt = anExamAttempt({ responses: [response] });

    expect(getExamItemResponse(attempt, "q-single-choice")).toEqual(response);
  });

  it("returns null when the question has no response", () => {
    const attempt: ExamAttempt = anExamAttempt({
      responses: [anExamItemResponse({ questionId: "q-true-false" })],
    });

    expect(getExamItemResponse(attempt, "q-single-choice")).toBeNull();
  });
});

describe("isExamQuestionRevealed", () => {
  it("reveals every question once the attempt is completed", () => {
    const attempt: ExamAttempt = anExamAttempt({ status: "completed", responses: [] });

    expect(isExamQuestionRevealed(attempt, "q-single-choice")).toBe(true);
    expect(isExamQuestionRevealed(attempt, "q-ordering")).toBe(true);
  });

  it("reveals a study question once it has been checked", () => {
    const attempt: ExamAttempt = anExamAttempt({
      mode: "study",
      status: "inProgress",
      responses: [
        anExamItemResponse({
          questionId: "q-single-choice",
          check: { at: "2026-09-28T09:05:00.000Z", correct: true },
        }),
      ],
    });

    expect(isExamQuestionRevealed(attempt, "q-single-choice")).toBe(true);
  });

  it("keeps a study question hidden until it has been checked", () => {
    const attempt: ExamAttempt = anExamAttempt({
      mode: "study",
      status: "inProgress",
      responses: [anExamItemResponse({ questionId: "q-single-choice", check: null })],
    });

    expect(isExamQuestionRevealed(attempt, "q-single-choice")).toBe(false);
  });

  it("keeps every question hidden in an exam attempt still in progress", () => {
    const attempt: ExamAttempt = anExamAttempt({
      mode: "exam",
      status: "inProgress",
      responses: [anExamItemResponse({ questionId: "q-single-choice" })],
    });

    expect(isExamQuestionRevealed(attempt, "q-single-choice")).toBe(false);
  });
});
