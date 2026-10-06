import type { Database } from "../db/client.js";
import { generationAttempts } from "../db/schema.js";
import type { StageEvent } from "../generation/pipeline.js";

/** What one attempt has spent so far, summed across its model calls. */
export interface AttemptMetrics {
  /** The manual retry round: `plan_generations.attempt_count`. */
  round: number;
  started: number;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  reasoningTokens: number;
}

export function newAttemptMetrics(): AttemptMetrics {
  return { round: 1, started: Date.now(), promptTokens: 0, cachedTokens: 0, completionTokens: 0, reasoningTokens: 0 };
}

type Job = { generationId: string; attempts: number };

/**
 * Records one model call — its step, whether its output was used, the exact
 * reason it was rejected, and its tokens — and adds its tokens to the attempt.
 * Never stores content. Logging must not change the job's outcome, so a failed
 * write is ignored.
 */
export async function recordCall(db: Database, job: Job, metrics: AttemptMetrics, event: StageEvent): Promise<void> {
  const { usage } = event;
  metrics.promptTokens += usage?.promptTokens ?? 0;
  metrics.cachedTokens += usage?.cachedTokens ?? 0;
  metrics.completionTokens += usage?.completionTokens ?? 0;
  metrics.reasoningTokens += usage?.reasoningTokens ?? 0;
  await db.insert(generationAttempts).values({
    generationId: job.generationId,
    stage: event.stage,
    round: metrics.round,
    attempt: job.attempts,
    outcome: event.outcome,
    error: event.error?.slice(0, 1000) ?? null,
    model: usage?.model ?? null,
    finishReason: usage?.finishReason ?? null,
    promptTokens: usage?.promptTokens ?? null,
    cachedPromptTokens: usage?.cachedTokens ?? null,
    completionTokens: usage?.completionTokens ?? null,
    reasoningTokens: usage?.reasoningTokens ?? null,
    durationMs: usage?.durationMs ?? 0,
  }).catch(() => undefined);
}

/**
 * Records a whole attempt: completed or failed, why, and its summed tokens.
 * Stage "reused" marks a plan copied from an earlier one, which cost nothing.
 */
export async function recordAttempt(db: Database, job: Job, metrics: AttemptMetrics, failure: { cause: unknown } | null,
  stage: "total" | "reused" = "total"): Promise<void> {
  await db.insert(generationAttempts).values({
    generationId: job.generationId,
    stage,
    round: metrics.round,
    attempt: job.attempts,
    outcome: failure ? "failed" : "completed",
    error: failure ? (failure.cause instanceof Error ? failure.cause.message : "Unknown generation failure").slice(0, 1000) : null,
    promptTokens: metrics.promptTokens,
    cachedPromptTokens: metrics.cachedTokens,
    completionTokens: metrics.completionTokens,
    reasoningTokens: metrics.reasoningTokens,
    durationMs: Date.now() - metrics.started,
  }).catch(() => undefined);
}
