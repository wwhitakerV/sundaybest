import { aTheologyExamAttempt, theologyExamContent } from "@tests/factories/exams";

import { parseExamContent } from "@/features/exams/data/parse-exam";
import { buildExamResult } from "@/features/exams/logic/build-result";
import type { QuestionReveal } from "@/features/exams/types";
import type { ExamItemResponse, ExamResponse } from "@/types/domain";

const AT = "2026-09-28T10:00:00.000Z";

function parsedRealExam() {
  const result = parseExamContent(theologyExamContent());
  if (!result.ok) throw new Error("expected the real content to parse — fix the fixture");
  return result;
}

/** One correct response per reveal, built from the reveal's own key. */
function correctResponses(reveals: QuestionReveal[]): ExamItemResponse[] {
  return reveals.map((reveal) => ({
    questionId: reveal.questionId,
    response: reveal.key,
    respondedAt: AT,
    check: null,
  }));
}

function withResponse(
  responses: ExamItemResponse[],
  questionId: string,
  response: ExamResponse,
): ExamItemResponse[] {
  return responses.map((entry) =>
    entry.questionId === questionId ? { ...entry, response } : entry,
  );
}

function withoutResponse(responses: ExamItemResponse[], questionId: string): ExamItemResponse[] {
  return responses.filter((entry) => entry.questionId !== questionId);
}

describe("buildExamResult: scoring each item (criterion 19)", () => {
  it("scores each answered item against its reveal's key", () => {
    const { reveals, exam } = parsedRealExam();
    let responses = correctResponses(reveals);
    // Q02's key is choice B — answer it wrong.
    responses = withResponse(responses, "THEO-01-01-Q02", { kind: "single_choice", choiceId: "A" });
    const attempt = aTheologyExamAttempt({ responses });

    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.items).toContainEqual({
      questionId: "THEO-01-01-Q01",
      correct: true,
      answered: true,
    });
    expect(result.items).toContainEqual({
      questionId: "THEO-01-01-Q02",
      correct: false,
      answered: true,
    });
  });

  it("scores an unanswered item as incorrect and unanswered", () => {
    const { reveals, exam } = parsedRealExam();
    const responses = withoutResponse(correctResponses(reveals), "THEO-01-01-Q01");
    const attempt = aTheologyExamAttempt({ responses });

    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.items).toContainEqual({
      questionId: "THEO-01-01-Q01",
      correct: false,
      answered: false,
    });
  });

  it("scores an incomplete response as incorrect and unanswered", () => {
    const { reveals, exam } = parsedRealExam();
    // Q04 is matching with 3 prompts (P1, P2, P3) — leave P3 unpaired.
    let responses = correctResponses(reveals);
    responses = withResponse(responses, "THEO-01-01-Q04", {
      kind: "matching",
      pairs: [
        { promptId: "P1", targetId: "R1" },
        { promptId: "P2", targetId: "R2" },
      ],
    });
    const attempt = aTheologyExamAttempt({ responses });

    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.items).toContainEqual({
      questionId: "THEO-01-01-Q04",
      correct: false,
      answered: false,
    });
  });
});

describe("buildExamResult: score and band (criterion 30)", () => {
  it("counts correct and total, and rounds the percentage (11 of 15 -> 73%)", () => {
    const { reveals, exam } = parsedRealExam();
    let responses = correctResponses(reveals);
    responses = withResponse(responses, "THEO-01-01-Q01", { kind: "single_choice", choiceId: "A" });
    responses = withResponse(responses, "THEO-01-01-Q02", { kind: "single_choice", choiceId: "A" });
    responses = withResponse(responses, "THEO-01-01-Q03", { kind: "true_false", choiceId: "F" });
    responses = withResponse(responses, "THEO-01-01-Q05", { kind: "single_choice", choiceId: "A" });
    const attempt = aTheologyExamAttempt({ responses });

    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.correct).toBe(11);
    expect(result.total).toBe(15);
    expect(result.percentage).toBe(73);
  });

  it("resolves the score band from rules.bands for the resulting percentage", () => {
    const { reveals, exam } = parsedRealExam();
    let responses = correctResponses(reveals);
    responses = withResponse(responses, "THEO-01-01-Q01", { kind: "single_choice", choiceId: "A" });
    responses = withResponse(responses, "THEO-01-01-Q02", { kind: "single_choice", choiceId: "A" });
    responses = withResponse(responses, "THEO-01-01-Q03", { kind: "true_false", choiceId: "F" });
    responses = withResponse(responses, "THEO-01-01-Q05", { kind: "single_choice", choiceId: "A" });
    const attempt = aTheologyExamAttempt({ responses });

    // 11 of 15 is 73%, which falls in the 70-79 "Developing" band.
    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.band).toBe("Developing");
  });
});

describe("buildExamResult: concept evidence (criteria 32, 34)", () => {
  it("labels concepts as independent observations for a first Exam Mode attempt", () => {
    const { reveals, exam } = parsedRealExam();
    const attempt = aTheologyExamAttempt({
      mode: "exam",
      practice: false,
      responses: correctResponses(reveals),
    });

    // berean_examination is the primary concept of Q08, Q10, and Q13 — exactly
    // the minimum of 3 independent observations, all correct here.
    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.concepts).toContainEqual({
      conceptId: "berean_examination",
      correct: 3,
      total: 3,
      label: "strength",
    });
    // scripture_known_in_childhood (Q01) has only one observation.
    expect(result.concepts).toContainEqual({
      conceptId: "scripture_known_in_childhood",
      correct: 1,
      total: 1,
      label: "notEnoughEvidence",
    });
  });

  it("keeps the raw score but marks every concept notEnoughEvidence for a Practice attempt", () => {
    const { reveals, exam } = parsedRealExam();
    const attempt = aTheologyExamAttempt({
      mode: "exam",
      practice: true,
      responses: correctResponses(reveals),
    });

    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.correct).toBe(15);
    expect(result.concepts.every((concept) => concept.label === "notEnoughEvidence")).toBe(true);
  });
});

describe("buildExamResult: Study Mode (criterion 27)", () => {
  it("returns a null band and every concept notEnoughEvidence for Study Mode", () => {
    const { reveals, exam } = parsedRealExam();
    const attempt = aTheologyExamAttempt({
      mode: "study",
      practice: false,
      responses: correctResponses(reveals),
    });

    const result = buildExamResult({ attempt, reveals, rules: exam.rules });

    expect(result.band).toBeNull();
    expect(result.correct).toBe(15);
    expect(result.concepts.every((concept) => concept.label === "notEnoughEvidence")).toBe(true);
  });
});
