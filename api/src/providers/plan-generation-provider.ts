import OpenAI from "openai";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";
import { createDevelopmentGenerator } from "../generation/development-generator.js";
import { addStagedQuickChecks, generateStagedPlan, type StageCaller, type StageEvent, type StepCheckpoint } from "../generation/pipeline.js";
import { generatedPlanSchema, type GeneratedPlan } from "../generation/schema.js";
import type { TranscriptSegment } from "../generation/transcript.js";
import { validatePlanStructure } from "../generation/validation.js";
import { createBibleProvider, type BibleProvider } from "./bible-provider.js";
import { postJson } from "./http.js";
import { createOpenAiStageCaller } from "./openai-stage-caller.js";

export { generatedPlanSchema, type GeneratedPlan } from "../generation/schema.js";

export interface PlanGenerationInput {
  sermon: { externalId: string; canonicalUrl: string; title: string; church: string | null; durationSeconds?: number | null };
  transcript: string;
  transcriptSegments?: readonly TranscriptSegment[];
  lengthDays: number;
  quickCheckEnabled: boolean;
}
/** What one model response cost and how it ended, for the attempt log. Never content. */
export interface GenerationUsage {
  model: string | null;
  finishReason: string | null;
  promptTokens: number | null;
  /** Of `promptTokens`, how many OpenAI billed at its cached rate. */
  cachedTokens: number | null;
  completionTokens: number | null;
  reasoningTokens: number | null;
  durationMs: number;
}
/** How a generation is observed and resumed: `report` hears about every step; `checkpoint` keeps accepted ones. */
export interface GenerationHooks {
  report?: (event: StageEvent) => void | Promise<void>;
  checkpoint?: StepCheckpoint;
}
export interface PlanGenerationProvider {
  generate(input: PlanGenerationInput, hooks?: GenerationHooks): Promise<GeneratedPlan>;
  /** Writes only the Quick Checks for a finished plan without them. Absent when a provider can only write whole plans. */
  addQuickChecks?(input: PlanGenerationInput, plan: GeneratedPlan, hooks?: GenerationHooks): Promise<GeneratedPlan>;
}

export function createPlanGenerationProvider(env: Env, options: { client?: OpenAI; call?: StageCaller; bible?: BibleProvider } = {}): PlanGenerationProvider {
  if (env.PLAN_GENERATION_PROVIDER_URL) {
    return { async generate(input) {
      const raw = await postJson({ url: env.PLAN_GENERATION_PROVIDER_URL!, token: env.PLAN_GENERATION_PROVIDER_TOKEN,
        body: input, timeoutMs: env.OPENAI_TIMEOUT_MS });
      const parsed = generatedPlanSchema.safeParse(raw);
      if (!parsed.success) throw new AppError("INTERNAL", "Plan-generation gateway returned invalid content");
      if (parsed.data.generator.provider === "development") throw new AppError("INTERNAL", "A gateway cannot publish development content");
      validatePlanStructure(parsed.data, input);
      return parsed.data;
    } };
  }
  if (!env.OPENAI_API_KEY) {
    if (env.NODE_ENV !== "production" && env.DEV_PLAN_GENERATION_ENABLED) return createDevelopmentGenerator();
    return { async generate() { throw new AppError("INTERNAL", "Set OPENAI_API_KEY to generate real SundayBest plans", { permanent: true }); } };
  }
  const call = options.call ?? createOpenAiStageCaller(options.client ?? new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: env.OPENAI_TIMEOUT_MS, maxRetries: 0 }), env);
  const bible = options.bible ?? createBibleProvider(env);
  const usable = (input: PlanGenerationInput) => {
    if (!input.transcript.trim() || input.transcript.length > env.GENERATION_MAX_TRANSCRIPT_CHARACTERS) throw new AppError("INTERNAL", "Transcript is empty or exceeds the generation input limit", { permanent: true });
  };
  return {
    async generate(input, hooks = {}) {
      usable(input);
      return generateStagedPlan(input, { call, bible, ...hooks });
    },
    async addQuickChecks(input, plan, hooks = {}) {
      usable(input);
      return addStagedQuickChecks(input, plan, { call, bible, ...hooks });
    },
  };
}
