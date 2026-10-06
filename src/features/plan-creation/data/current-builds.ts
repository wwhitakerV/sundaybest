import type { ApiPlanGeneration } from "@/core/api/contracts";
import type { Build } from "../logic/generation-bar";

/** A build as the server reports it, as the generation bar knows it. */
export function toBuild(generation: ApiPlanGeneration): Build {
  return {
    id: generation.id,
    planId: generation.planId,
    title: generation.planTitle,
    status: generation.status,
    progress: generation.progress,
    lengthDays: generation.requestedLength,
    quickCheck: generation.quickCheckEnabled,
    error: generation.error,
  };
}
