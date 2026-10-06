import type { ZodType } from "zod";

import { AppError } from "../http/errors.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import type { GenerationUsage } from "../providers/plan-generation-provider.js";

export type StageKind = "outline" | "day" | "quiz";

export interface StageRequest {
  /** "plan", "day 3", "quiz 3": names the call in the attempt log. */
  stage: string;
  kind: StageKind;
  /** Routes a plan's calls to the same provider cache: one key per sermon. */
  cacheKey: string;
  instructions: string;
  /** The sermon and transcript, identical across the plan's calls. */
  context: string;
  task: string;
  schema: ZodType;
  schemaName: string;
}

export interface StageResponse {
  content: string | null;
  finishReason: string | null;
  refusal: string | null;
  model: string;
  /** `cachedTokens` is the part of `promptTokens` billed at the cached rate. */
  usage: { promptTokens: number | null; cachedTokens: number | null; completionTokens: number | null; reasoningTokens: number | null };
}

export type StageCaller = (request: StageRequest) => Promise<StageResponse>;

/** One step: a model call and whether its output was used, or a step taken from an earlier run. Never content. */
export interface StageEvent {
  stage: string;
  kind: StageKind;
  outcome: "accepted" | "rejected" | "resumed";
  error: string | null;
  usage: GenerationUsage | null;
}

/** Where accepted steps are kept, so a retried or reclaimed generation resumes. */
export interface StepCheckpoint {
  /** The saved result for a step, or null. */
  load(key: string): Promise<unknown>;
  save(key: string, result: unknown): Promise<void>;
}

export interface PipelineDeps {
  call: StageCaller;
  bible: BibleProvider;
  /** Hears about every step; a returned promise is awaited before the step finishes. */
  report?: (event: StageEvent) => void | Promise<void>;
  checkpoint?: StepCheckpoint;
}

export interface Step<T> {
  kind: StageKind;
  stage: string;
  /** Names the step and what it was written from, so a saved result is used only for the same input. */
  key: string;
  /** False when the step must be written fresh, such as a rewrite told what to avoid; its result is still saved. */
  resumable: boolean;
  instructions: string;
  /** The task, told why earlier attempts were rejected. */
  task: (rejected: readonly string[]) => string;
  schema: ZodType;
  schemaName: string;
  /** Verifies the model's output; throwing rejects it. */
  map: (raw: unknown) => T | Promise<T>;
  /** Parses a saved result back. */
  saved: ZodType<T>;
}

/** Calls per step before the plan fails: a rejected day or quiz is redone on its own. */
const STEP_ATTEMPTS = 3;

/**
 * Runs a plan's steps against one shared context. A step saved by an earlier
 * run is reused. Otherwise it is written up to three times; each retry is told
 * exactly why the earlier answers were rejected, and every call is reported.
 */
export function stepRunner(context: string, cacheKey: string, deps: PipelineDeps) {
  let model: string | null = null;
  return {
    model: () => model,
    async step<T>(step: Step<T>): Promise<T> {
      const { stage, kind } = step;
      if (step.resumable && deps.checkpoint) {
        const saved = step.saved.safeParse(await deps.checkpoint.load(step.key));
        if (saved.success) {
          await deps.report?.({ stage, kind, outcome: "resumed", error: null, usage: null });
          return saved.data;
        }
      }
      const rejected: string[] = [];
      let failure: unknown;
      for (let attempt = 1; attempt <= STEP_ATTEMPTS; attempt++) {
        const started = Date.now();
        let response: StageResponse;
        try {
          response = await deps.call({ stage, kind, cacheKey, instructions: step.instructions, context, task: step.task(rejected),
            schema: step.schema, schemaName: step.schemaName });
        } catch (cause) {
          await deps.report?.({ stage, kind, outcome: "rejected", error: messageOf(cause), usage: null });
          // A configuration problem, such as a bad key, will not improve on retry.
          if (cause instanceof AppError && cause.permanent) throw cause;
          failure = cause;
          continue;
        }
        const usage: GenerationUsage = { model: response.model, finishReason: response.finishReason, ...response.usage, durationMs: Date.now() - started };
        model = response.model;
        try {
          const result = await step.map(parseResponse(response, stage));
          await deps.report?.({ stage, kind, outcome: "accepted", error: null, usage });
          // Saving only speeds up a re-run, so a failed save never fails the step.
          await deps.checkpoint?.save(step.key, result).catch(() => undefined);
          return result;
        } catch (cause) {
          // Output that fails a check is always worth another attempt, told why.
          await deps.report?.({ stage, kind, outcome: "rejected", error: messageOf(cause), usage });
          rejected.push(messageOf(cause));
          failure = cause;
        }
      }
      throw failure;
    },
  };
}

export type StepRunner = ReturnType<typeof stepRunner>;

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Unknown failure";
}

function parseResponse(response: StageResponse, stage: string): unknown {
  if (response.refusal) throw new AppError("INTERNAL", `The ${stage} step was refused`);
  if (response.finishReason !== "stop" || !response.content) {
    throw new AppError("INTERNAL", `The ${stage} step did not finish (${response.finishReason ?? "no response"})`);
  }
  try {
    return JSON.parse(response.content);
  } catch {
    throw new AppError("INTERNAL", `The ${stage} step returned invalid JSON`);
  }
}
