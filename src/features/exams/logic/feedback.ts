import type { ExamResponse, Id } from "@/types/domain";

import type { ExamAnswerKey, ExamOption, OptionFeedback } from "../types";

/**
 * How one choice shows once its answer is revealed:
 * - `correct` — a right answer (picked, or for one-answer questions, the right one);
 * - `incorrect` — a wrong pick;
 * - `missed` — a right answer of several that wasn't picked;
 * - `faded` — none of those.
 */
type ChoiceFeedbackState = "correct" | "incorrect" | "missed" | "faded";

export type ChoiceFeedback = {
  choiceId: Id;
  state: ChoiceFeedbackState;
  picked: boolean;
  /** Its rationale, where the reveal calls for one; null otherwise. */
  rationale: string | null;
};

function textFor(feedback: readonly OptionFeedback[], optionId: Id): string | null {
  return feedback.find((line) => line.optionId === optionId)?.text ?? null;
}

function pickedIds(response: ExamResponse | null): Id[] {
  if (!response) return [];
  if ("choiceId" in response) return [response.choiceId];
  return "choiceIds" in response ? response.choiceIds : [];
}

function keyedIds(key: ExamAnswerKey): Id[] {
  if ("choiceId" in key) return [key.choiceId];
  return "choiceIds" in key ? key.choiceIds : [];
}

/**
 * Each choice of a revealed single-choice, true/false, or multiple-select
 * question, in its own order. One answer: the right choice and a wrong pick
 * each carry their rationale. Several: every wrong pick and every missed
 * right answer carries its rationale; the right picks stand on their own.
 */
export function getChoiceFeedback(input: {
  choices: readonly ExamOption[];
  response: ExamResponse | null;
  key: ExamAnswerKey;
  feedback: readonly OptionFeedback[];
}): ChoiceFeedback[] {
  const { choices, response, key, feedback } = input;
  const picked = new Set(pickedIds(response));
  const keyed = new Set(keyedIds(key));
  const several = key.kind === "multiple_select";

  return choices.map(({ id }) => {
    const isPicked = picked.has(id);
    const isKeyed = keyed.has(id);
    const state: ChoiceFeedbackState = isKeyed
      ? isPicked || !several
        ? "correct"
        : "missed"
      : isPicked
        ? "incorrect"
        : "faded";
    const explained =
      state === "incorrect" || state === "missed" || (state === "correct" && !several);
    return {
      choiceId: id,
      state,
      picked: isPicked,
      rationale: explained ? textFor(feedback, id) : null,
    };
  });
}

export type MatchingFeedback = {
  promptId: Id;
  correctTargetId: Id;
  pickedTargetId: Id | null;
  right: boolean;
  text: string;
};

/** Each prompt of a revealed matching question, in order: its right target, the one picked, and its feedback. */
export function getMatchingFeedback(input: {
  prompts: readonly ExamOption[];
  response: ExamResponse | null;
  key: ExamAnswerKey;
  feedback: readonly OptionFeedback[];
}): MatchingFeedback[] {
  const { prompts, response, key, feedback } = input;
  const keyPairs = "pairs" in key ? key.pairs : [];
  const picked = response && "pairs" in response ? response.pairs : [];

  return prompts.map(({ id }) => {
    const correctTargetId = keyPairs.find((pair) => pair.promptId === id)?.targetId ?? "";
    const pickedTargetId = picked.find((pair) => pair.promptId === id)?.targetId ?? null;
    return {
      promptId: id,
      correctTargetId,
      pickedTargetId,
      right: pickedTargetId === correctTargetId,
      text: textFor(feedback, id) ?? "",
    };
  });
}

export type OrderingFeedback = {
  /** From 1, along the right sequence. */
  position: number;
  /** The step that belongs here. */
  stepId: Id;
  /** The step placed here, if any. */
  pickedStepId: Id | null;
  right: boolean;
  text: string;
};

/** Each place in a revealed ordering question's right sequence: the step that belongs, the one placed, and its feedback. */
export function getOrderingFeedback(input: {
  response: ExamResponse | null;
  key: ExamAnswerKey;
  feedback: readonly OptionFeedback[];
}): OrderingFeedback[] {
  const { response, key, feedback } = input;
  const sequence = "stepIds" in key ? key.stepIds : [];
  const placed = response && "stepIds" in response ? response.stepIds : [];

  return sequence.map((stepId, index) => {
    const pickedStepId = placed.at(index) ?? null;
    return {
      position: index + 1,
      stepId,
      pickedStepId,
      right: pickedStepId === stepId,
      text: textFor(feedback, stepId) ?? "",
    };
  });
}
