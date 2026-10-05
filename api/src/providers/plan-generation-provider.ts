import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";
import { createDevelopmentGenerator } from "../generation/development-generator.js";
import { mapGenerationOutput } from "../generation/mapper.js";
import { generationOutputSchema } from "../generation/output-schema.js";
import { GENERATOR_VERSION, PROMPT_VERSION, generationInstructions, generationUserMessage } from "../generation/prompt.js";
import { generatedPlanSchema, type GeneratedPlan } from "../generation/schema.js";
import type { TranscriptSegment } from "../generation/transcript.js";
import { validatePlanStructure } from "../generation/validation.js";
import { postJson } from "./http.js";

export { generatedPlanSchema, type GeneratedPlan } from "../generation/schema.js";

export interface PlanGenerationInput {
  sermon: { externalId: string; canonicalUrl: string; title: string; church: string | null; durationSeconds?: number | null };
  transcript: string;
  transcriptSegments?: readonly TranscriptSegment[];
  lengthDays: number;
  quickCheckEnabled: boolean;
}
export interface PlanGenerationProvider { generate(input: PlanGenerationInput): Promise<GeneratedPlan>; }

export function createPlanGenerationProvider(env: Env, options: { client?: OpenAI } = {}): PlanGenerationProvider {
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
    return { async generate() { throw new AppError("INTERNAL", "Set OPENAI_API_KEY to generate real SundayBest plans"); } };
  }
  const client = options.client ?? new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: env.OPENAI_TIMEOUT_MS, maxRetries: 0 });
  return { async generate(input) {
    if (!input.transcript.trim() || input.transcript.length > env.GENERATION_MAX_TRANSCRIPT_CHARACTERS) throw new AppError("INTERNAL", "Transcript is empty or exceeds the generation input limit");
    try {
      const completion = await client.chat.completions.parse({
        model: env.OPENAI_MODEL,
        messages: [{ role: "system", content: generationInstructions }, { role: "user", content: generationUserMessage(input) }],
        response_format: zodResponseFormat(generationOutputSchema, "sundaybest_plan"),
        max_completion_tokens: env.OPENAI_MAX_COMPLETION_TOKENS,
        store: false,
      });
      const choice = completion.choices[0];
      if (!choice || choice.finish_reason !== "stop" || choice.message.refusal || !choice.message.parsed) throw new AppError("INTERNAL", "OpenAI did not return a complete SundayBest plan");
      const plan = mapGenerationOutput(choice.message.parsed, input, {
        version: GENERATOR_VERSION, promptVersion: PROMPT_VERSION, provider: "openai", model: completion.model,
      });
      validatePlanStructure(plan, input);
      return plan;
    } catch (cause) {
      if (cause instanceof AppError) throw cause;
      const status = cause instanceof OpenAI.APIError ? cause.status : undefined;
      // SDK error bodies can contain input data: retain a safe summary only.
      throw new AppError("INTERNAL", status ? `OpenAI generation failed with HTTP ${status}` : "OpenAI generation failed", { exposeMessage: false });
    }
  } };
}
