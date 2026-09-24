import type { PlanGeneration, PlanGenerationStatus } from "@/types/domain";

import type { AppState } from "../state";

const SETTLED: readonly PlanGenerationStatus[] = ["idle", "completed", "failed"];

/** The plan being built, if any. */
export function getPlanGeneration(state: AppState): PlanGeneration | null {
  return state.generation;
}

/** Whether a plan is being built right now. */
export function isGeneratingPlan(state: AppState): boolean {
  return state.generation !== null && !SETTLED.includes(state.generation.status);
}
