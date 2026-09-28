import type { ExamPair, Id } from "@/types/domain";

/** A multiple-select pick: selected if it wasn't, cleared if it was. */
export function toggleChoice(choiceIds: readonly Id[], choiceId: Id): Id[] {
  return choiceIds.includes(choiceId)
    ? choiceIds.filter((id) => id !== choiceId)
    : [...choiceIds, choiceId];
}

/**
 * An ordering tap: an unplaced step takes the next number; a placed one is
 * taken out, and the steps after it move up.
 */
export function togglePlacedStep(stepIds: readonly Id[], stepId: Id): Id[] {
  return stepIds.includes(stepId) ? stepIds.filter((id) => id !== stepId) : [...stepIds, stepId];
}

/**
 * A matching pick: the prompt takes the target, replacing whatever it had.
 * Each target pairs once — one already paired elsewhere moves here, and the
 * prompt it left is unpaired (never swapped). `movedFrom` names that prompt.
 */
export function pairTarget(
  pairs: readonly ExamPair[],
  promptId: Id,
  targetId: Id,
): { pairs: ExamPair[]; movedFrom: Id | null } {
  const current = pairs.find((pair) => pair.promptId === promptId);
  if (current?.targetId === targetId) return { pairs: [...pairs], movedFrom: null };
  const holder = pairs.find((pair) => pair.targetId === targetId && pair.promptId !== promptId);
  const rest = pairs.filter((pair) => pair.promptId !== promptId && pair !== holder);
  return { pairs: [...rest, { promptId, targetId }], movedFrom: holder?.promptId ?? null };
}
