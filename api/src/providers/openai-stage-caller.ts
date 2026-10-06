import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import type { Env } from "../config/env.js";
import type { StageCaller } from "../generation/pipeline.js";
import { SOURCE_PREAMBLE } from "../generation/prompts/context.js";
import { AppError } from "../http/errors.js";

/**
 * One generation step as an OpenAI call. Every call of a plan opens with the
 * same preamble and sermon context, marked as the end of a reusable prefix and
 * keyed by sermon, so after the first call OpenAI bills the transcript at its
 * cached rate; the step's instructions and task follow. `create` rather than
 * `parse`: `parse` throws away a truncated response, and with it the finish
 * reason and usage.
 */
export function createOpenAiStageCaller(client: OpenAI, env: Env): StageCaller {
  return async (request) => {
    try {
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: SOURCE_PREAMBLE },
          { role: "user", content: [{ type: "text", text: request.context, prompt_cache_breakpoint: { mode: "explicit" } }] },
          { role: "system", content: request.instructions },
          { role: "user", content: request.task },
        ],
        prompt_cache_key: request.cacheKey,
        response_format: zodResponseFormat(request.schema, request.schemaName),
        max_completion_tokens: env.OPENAI_MAX_COMPLETION_TOKENS,
        store: false,
      });
      const choice = completion.choices[0];
      return {
        content: choice?.message.content ?? null,
        finishReason: choice?.finish_reason ?? null,
        refusal: choice?.message.refusal ?? null,
        model: completion.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens ?? null,
          cachedTokens: completion.usage?.prompt_tokens_details?.cached_tokens ?? null,
          completionTokens: completion.usage?.completion_tokens ?? null,
          reasoningTokens: completion.usage?.completion_tokens_details?.reasoning_tokens ?? null,
        },
      };
    } catch (cause) {
      const status = cause instanceof OpenAI.APIError ? cause.status : undefined;
      // SDK error bodies can contain input data: keep a safe summary only. A
      // rejected key will not work on retry.
      throw new AppError("INTERNAL", status ? `OpenAI generation failed with HTTP ${status}` : "OpenAI generation failed",
        { exposeMessage: false, permanent: status === 401 || status === 403 });
    }
  };
}
