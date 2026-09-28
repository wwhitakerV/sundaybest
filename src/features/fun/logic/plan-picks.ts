import type { Id, Plan, PlanDay, StudyStep } from "@/types/domain";

/** How many days the "From your plans" rail offers before "See all". */
export const PLAN_PICK_LIMIT = 6;

/** What a pick offers to do: one of its day's study steps, or its quick check. */
export type PlanPickActivity = StudyStep | "quiz";

/** The Daily Study's steps, in the order they're taken. */
const STEP_ORDER: readonly StudyStep[] = ["read", "scripture", "reflect", "pray"];

/** The user's plans with the one under way, if any, moved to the front. */
export function putActivePlanFirst(plans: readonly Plan[], activePlanId: Id | null): Plan[] {
  const active = plans.filter((plan) => plan.id === activePlanId);
  return [...active, ...plans.filter((plan) => plan.id !== activePlanId)];
}

/** A plan's days the user has reached — not locked — the newest first. */
export function getReachedDaysNewestFirst(days: readonly PlanDay[]): PlanDay[] {
  return days.filter((day) => day.status !== "locked").sort((a, b) => b.dayNumber - a.dayNumber);
}

/**
 * What a reached day offers from Fun: under way, the step it's on — to pick
 * up where it was left; finished, its Scripture — to go back to. Then its
 * quick check, when it has one.
 */
export function getPlanPickActivities(
  day: Pick<PlanDay, "status" | "completedSteps">,
  hasQuiz: boolean,
): PlanPickActivity[] {
  const next =
    day.status === "completed"
      ? undefined
      : STEP_ORDER.find((step) => !day.completedSteps.includes(step));
  const first: PlanPickActivity = next ?? "scripture";
  return hasQuiz ? [first, "quiz"] : [first];
}

/** Which of the artworks a day wears: they take turns, day by day. */
export function getPlanPickArtwork<T>(dayNumber: number, artworks: readonly [T, ...T[]]): T {
  const index = (((dayNumber - 1) % artworks.length) + artworks.length) % artworks.length;
  return artworks.at(index) ?? artworks[0];
}
