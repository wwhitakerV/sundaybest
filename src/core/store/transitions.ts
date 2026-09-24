import type { PlanDayStatus, PlanGenerationStatus, PlanStatus } from "@/types/domain";

/**
 * Which way each status may move — the rules the reducer enforces. Anything
 * not listed is an impossible transition, and the action is ignored.
 */

const PLAN_MOVES = new Map<PlanStatus, readonly PlanStatus[]>([
  ["draft", ["generating", "archived"]],
  // Back to draft only when building fails.
  ["generating", ["ready", "draft"]],
  ["ready", ["active", "archived"]],
  ["active", ["completed", "archived"]],
  ["completed", ["archived"]],
  ["archived", []],
]);

export function canMovePlan(from: PlanStatus, to: PlanStatus): boolean {
  return PLAN_MOVES.get(from)?.includes(to) ?? false;
}

const DAY_MOVES = new Map<PlanDayStatus, readonly PlanDayStatus[]>([
  // A locked day opens first; it can never be completed straight away.
  ["locked", ["available"]],
  ["available", ["inProgress", "completed"]],
  ["inProgress", ["completed"]],
  // Completed once, for good.
  ["completed", []],
]);

export function canMoveDay(from: PlanDayStatus, to: PlanDayStatus): boolean {
  return DAY_MOVES.get(from)?.includes(to) ?? false;
}

/** Building a plan, stage by stage, in order. */
export const GENERATION_STAGES: readonly PlanGenerationStatus[] = [
  "validating",
  "preparing",
  "processingSermon",
  "findingScripture",
  "writingDays",
  "buildingQuiz",
];

/** Whether a build is under way (past idle, not yet finished or failed). */
export function isGenerationRunning(status: PlanGenerationStatus): boolean {
  return GENERATION_STAGES.includes(status);
}

/** A build only moves forward through its stages, never back or sideways. */
export function canAdvanceGeneration(
  from: PlanGenerationStatus,
  to: PlanGenerationStatus,
): boolean {
  const fromIndex = GENERATION_STAGES.indexOf(from);
  return fromIndex !== -1 && GENERATION_STAGES.indexOf(to) > fromIndex;
}

/** A reminder time is 24-hour `HH:mm`. */
export function isLocalTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
