import assert from "node:assert/strict";
import test from "node:test";
import OpenAI from "openai";
import { z } from "zod";
import { SOURCE_PREAMBLE } from "../src/generation/prompts/context.js";
import { createOpenAiStageCaller } from "../src/providers/openai-stage-caller.js";
import { testEnv } from "./fixtures/generation.js";

const request = { stage: "day 1", kind: "day" as const, cacheKey: "sermon:abc123", instructions: "Instructions.", context: "Shared context.", task: "{\"day\":1}", schema: z.object({ ok: z.boolean() }), schemaName: "sundaybest_day" };
const usage = { prompt_tokens: 1200, completion_tokens: 800, total_tokens: 2000, prompt_tokens_details: { cached_tokens: 1024 }, completion_tokens_details: { reasoning_tokens: 300 } };

type Body = { model: string; store: boolean; prompt_cache_key: string; messages: Array<{ role: string; content: unknown }>; response_format: { json_schema: { name: string; strict: boolean } } };

function client(respond: (body: Body) => Response) {
  return new OpenAI({ apiKey: "test-key", maxRetries: 0, fetch: async (_url, init) => respond(JSON.parse(String(init?.body))) });
}

test("each step sends strict structured output and no storage", async () => {
  const caller = createOpenAiStageCaller(client((body) => {
    assert.equal(body.model, "gpt-5.6-luna");
    assert.equal(body.store, false);
    assert.equal(body.response_format.json_schema.strict, true);
    assert.equal(body.response_format.json_schema.name, "sundaybest_day");
    return Response.json({ id: "x", object: "chat.completion", created: 0, model: "test-snapshot", usage,
      choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "{\"ok\":true}" } }] });
  }), testEnv());
  const response = await caller(request);
  assert.deepEqual(response, { content: "{\"ok\":true}", finishReason: "stop", refusal: null, model: "test-snapshot",
    usage: { promptTokens: 1200, cachedTokens: 1024, completionTokens: 800, reasoningTokens: 300 } });
});

test("the shared context leads every step and ends a cached prefix, so all of a plan's calls reuse it", async () => {
  const caller = createOpenAiStageCaller(client((body) => {
    assert.equal(body.prompt_cache_key, "sermon:abc123");
    assert.deepEqual(body.messages.map((message) => message.role), ["system", "user", "system", "user"]);
    assert.equal(body.messages[0]!.content, SOURCE_PREAMBLE);
    assert.deepEqual(body.messages[1]!.content, [{ type: "text", text: "Shared context.", prompt_cache_breakpoint: { mode: "explicit" } }]);
    assert.equal(body.messages[2]!.content, "Instructions.");
    assert.equal(body.messages[3]!.content, "{\"day\":1}");
    return Response.json({ id: "x", object: "chat.completion", created: 0, model: "m", usage,
      choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "{\"ok\":true}" } }] });
  }), testEnv());
  await caller(request);
});

test("a cut-off response still returns its finish reason and usage", async () => {
  const caller = createOpenAiStageCaller(client(() => Response.json({ id: "x", object: "chat.completion", created: 0, model: "m", usage,
    choices: [{ index: 0, finish_reason: "length", message: { role: "assistant", content: "{\"ok\":" } }] })), testEnv());
  const response = await caller(request);
  assert.equal(response.finishReason, "length");
  assert.equal(response.usage.completionTokens, 800);
});

for (const status of [401, 429, 500]) {
  test(`HTTP ${status} fails without echoing provider error bodies`, async () => {
    const caller = createOpenAiStageCaller(client(() => Response.json({ error: { message: "SECRET user transcript data", type: "t", code: "c" } }, { status })), testEnv());
    await assert.rejects(() => caller(request), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, new RegExp(`HTTP ${status}`));
      assert.doesNotMatch(error.message, /SECRET/);
      return true;
    });
  });
}
