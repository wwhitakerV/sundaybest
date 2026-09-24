import type { PlanGeneration, PlanGenerationError, PlanGenerationStatus } from "@/types/domain";
import { GENERATION_STAGES } from "@/core/store";

import { getMockBuildFailure } from "./build-outcome";

/** What a running build does next: move on a stage, fail, or finish. */
export type BuildMove =
  | { type: "step"; status: PlanGenerationStatus }
  | { type: "fail"; error: PlanGenerationError }
  | { type: "complete" };

/**
 * The next move for a build under way — or null for one that isn't. Stages
 * run in order, skipping the quiz for a plan without a Quick Check; a build
 * set to fail (`getMockBuildFailure`) fails at its stage instead of moving on.
 */
export function getNextBuildMove(
  generation: PlanGeneration,
  quickCheckEnabled: boolean,
): BuildMove | null {
  const index = GENERATION_STAGES.indexOf(generation.status);
  if (index === -1) return null;

  const failure = getMockBuildFailure(generation.sourceUrl, generation.attempt);
  if (failure?.at === generation.status) return { type: "fail", error: failure.error };

  const next = GENERATION_STAGES.slice(index + 1).find(
    (stage) => quickCheckEnabled || stage !== "buildingQuiz",
  );
  return next ? { type: "step", status: next } : { type: "complete" };
}
