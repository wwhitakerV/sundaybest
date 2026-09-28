import type { ExamResponse } from "@/types/domain";

import type { ExamAnswerKey } from "../types";

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  const set = new Set(a);
  return set.size === a.length && a.length === b.length && b.every((id) => set.has(id));
}

/**
 * Whether a response matches its question's key exactly — by ID, never by
 * position or wording, and with no partial credit: one choice for single
 * choice and true/false, the exact set for multiple select, every pairing
 * for matching, the exact sequence for ordering. No response is wrong.
 */
export function isResponseCorrect(key: ExamAnswerKey, response: ExamResponse | null): boolean {
  if (!response || response.kind !== key.kind) return false;
  switch (key.kind) {
    case "single_choice":
    case "true_false":
      return "choiceId" in response && response.choiceId === key.choiceId;
    case "multiple_select":
      return "choiceIds" in response && sameSet(response.choiceIds, key.choiceIds);
    case "matching": {
      if (!("pairs" in response)) return false;
      const given = response.pairs.map((pair) => `${pair.promptId}→${pair.targetId}`);
      return sameSet(
        given,
        key.pairs.map((pair) => `${pair.promptId}→${pair.targetId}`),
      );
    }
    case "ordering":
      return (
        "stepIds" in response &&
        response.stepIds.length === key.stepIds.length &&
        response.stepIds.every((stepId, index) => stepId === key.stepIds.at(index))
      );
  }
}
