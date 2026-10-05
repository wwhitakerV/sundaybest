import assert from "node:assert/strict";
import test from "node:test";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { createPlanGenerationProvider } from "../src/providers/plan-generation-provider.js";
import { mapGenerationOutput } from "../src/generation/mapper.js";
import { generationOutputSchema } from "../src/generation/output-schema.js";
import { canonicalizeScripture, referenceIsNamed } from "../src/generation/scripture.js";
import { formatTranscript, normalizeTranscript } from "../src/generation/transcript.js";
import { validateGeneratedContent, validatePlanStructure } from "../src/generation/validation.js";
import { generationInput, generationOutput, metadata, sourceQuote, testEnv } from "./fixtures/generation.js";

for (const days of [1, 7]) for (const quickCheck of [false, true]) {
  test(`maps ${days} days with Quick Check ${quickCheck ? 'on' : 'off'}`, () => {
    const input = generationInput(days, quickCheck);
    const plan = mapGenerationOutput(generationOutput(days, quickCheck), input, metadata);
    validatePlanStructure(plan, input);
    assert.equal(plan.title, "God’s love");
    assert.equal(plan.days.length, days);
    assert.equal(plan.days[0]!.quickCheck?.questions[0]?.choices[0]?.label ?? null, quickCheck ? "A" : null);
    assert.equal('evidenceQuote' in plan.days[0]!.scripture, false);
  });
}

test("timestamp blocks preserve source offsets, sort captions, and never invent timing", () => {
  assert.equal(formatTranscript([{ startMs: 31000, endMs: 32000, text: "Two" }, { startMs: 1000, endMs: 2000, text: " One  " }]), "[00:00:01–00:00:02] One\n\n[00:00:31–00:00:32] Two");
  assert.equal(formatTranscript([{ startMs: 0, endMs: null, text: "Untimed" }]), "[TIMING UNAVAILABLE] Untimed");
  assert.throws(() => normalizeTranscript([{ startMs: 20, endMs: 10, text: "Invalid" }]));
  assert.throws(() => normalizeTranscript([{ startMs: 0, endMs: null, text: "  " }]));
});

test("Scripture evidence accepts numeric/spoken references and rejects invented citations", () => {
  const scripture = canonicalizeScripture({ book: "1 John", chapter: 3, verseStart: 16, verseEnd: 18, reference: "1 John 3:16-18" });
  assert.equal(referenceIsNamed("First John chapter three verses sixteen through eighteen", scripture), true);
  assert.equal(referenceIsNamed("1 John 3:16-18", scripture), true);
  assert.equal(referenceIsNamed("1 John chapter 3", scripture), true);
  assert.equal(referenceIsNamed("John 3:16-18", scripture), false);
  const raw = generationOutput();
  raw.days[0]!.scripture.evidenceQuote = "Invented John 3:16 quote";
  assert.throws(() => mapGenerationOutput(raw, generationInput(), metadata), /evidence/);
  raw.days[0]!.scripture.evidenceQuote = sourceQuote;
  raw.days[0]!.scripture.reference = "Romans 3:16";
  assert.throws(() => mapGenerationOutput(raw, generationInput(), metadata), /disagree/);
});

for (const [name, mutate] of [
  ["wrong day count", (p: ReturnType<typeof mapGenerationOutput>) => { p.days.push({ ...p.days[0]!, dayNumber: 2 }); }],
  ["blank reading", (p: ReturnType<typeof mapGenerationOutput>) => { p.days[0]!.readingParagraphs = [" "]; }],
  ["invented sermon quote", (p: ReturnType<typeof mapGenerationOutput>) => { p.days[0]!.sermonQuote = "Invented words"; }],
  ["out-of-range clip", (p: ReturnType<typeof mapGenerationOutput>) => { p.days[0]!.clipEndSeconds = 100; }],
  ["incorrect clip location", (p: ReturnType<typeof mapGenerationOutput>) => { p.days[0]!.clipStartSeconds = 30; p.days[0]!.clipEndSeconds = 60; }],
  ["disabled quiz returned", (p: ReturnType<typeof mapGenerationOutput>) => { p.days[0]!.quickCheck = mapGenerationOutput(generationOutput(1, true), generationInput(1, true), metadata).days[0]!.quickCheck; }],
] as const) test(`rejects ${name}`, () => {
  const input = generationInput();
  const plan = mapGenerationOutput(generationOutput(), input, metadata);
  mutate(plan);
  assert.throws(() => validatePlanStructure(plan, input));
});

test("rejects duplicate choices, answer keys, missing required quizzes, and duplicate prompts", () => {
  const input = generationInput(1, true);
  const plan = mapGenerationOutput(generationOutput(1, true), input, metadata);
  const q = plan.days[0]!.quickCheck!.questions[0]!;
  q.choices[1]!.text = q.choices[0]!.text;
  assert.throws(() => validatePlanStructure(plan, input), /distinct/);
  q.choices[1]!.text = "Different"; q.choices[1]!.correct = true;
  assert.throws(() => validatePlanStructure(plan, input));
  plan.days[0]!.quickCheck = null;
  assert.throws(() => validatePlanStructure(plan, input), /setting/);
  const longer = mapGenerationOutput(generationOutput(7, true), generationInput(7, true), metadata);
  longer.days[1]!.quickCheck!.questions[0]!.prompt = longer.days[0]!.quickCheck!.questions[0]!.prompt;
  assert.throws(() => validatePlanStructure(longer, generationInput(7, true)), /Duplicate Quick Check/);
});

test("rejects fabricated question evidence and clips on untimed transcripts", () => {
  const raw = generationOutput(1, true);
  raw.days[0]!.quickCheck!.questions[0]!.evidenceQuote = "Invented evidence";
  assert.throws(() => mapGenerationOutput(raw, generationInput(1, true), metadata), /evidence/);
  const input = generationInput();
  input.transcriptSegments = [{ startMs: 0, endMs: null, text: sourceQuote }];
  assert.throws(() => validatePlanStructure(mapGenerationOutput(generationOutput(), input, metadata), input), /timing/);
});

test("Bible validation checks each unique passage once and rejects incomplete ranges", async () => {
  const input = generationInput(7);
  const plan = mapGenerationOutput(generationOutput(7), input, metadata);
  let calls = 0;
  const bible = { async getPassage() { calls++; return { reference: "John 3:16", translation: "KJV" as const, provider: "test", cacheAllowed: false, verses: [{ number: 16, text: "Test verse text" }] }; } };
  await validateGeneratedContent(plan, input, bible);
  assert.equal(calls, 1);
  await assert.rejects(() => validateGeneratedContent(plan, input, { async getPassage() { return { ...await bible.getPassage(), verses: [{ number: 17, text: "Wrong verse" }] }; } }), /complete requested/);
});

test("OpenAI SDK sends strict JSON schema, server-only metadata, no storage, and maps real transport JSON", async () => {
  const client = new OpenAI({ apiKey: "test-key", maxRetries: 0, fetch: async (_url, init) => {
    const request = JSON.parse(String(init?.body));
    assert.equal(request.store, false);
    assert.equal(request.model, "gpt-5.6-luna");
    assert.equal(request.response_format.json_schema.strict, true);
    assert.equal(request.response_format.json_schema.schema.additionalProperties, false);
    assert.equal('generator' in request.response_format.json_schema.schema.properties, false);
    assert.match(request.messages[1].content, /00:00:30/);
    return Response.json({ id: "test-completion", object: "chat.completion", created: 0, model: "test-snapshot", choices: [{ index: 0,
      finish_reason: "stop", message: { role: "assistant", content: JSON.stringify(generationOutput()) } }] });
  } });
  const plan = await createPlanGenerationProvider(testEnv(), { client }).generate(generationInput());
  assert.equal(plan.generator.model, "test-snapshot");
  assert.equal(plan.generator.provider, "openai");
  assert.equal(plan.generator.promptVersion, "sundaybest-plan-1");
  assert.doesNotThrow(() => zodResponseFormat(generationOutputSchema, "test"));
});

for (const outcome of ["refusal", "length", "invalid", "rateLimit", "authFailure"] as const) {
  test(`OpenAI ${outcome} never returns a publishable plan`, async () => {
    const client = new OpenAI({ apiKey: "test-key", maxRetries: 0, fetch: async () => {
      if (outcome === "rateLimit" || outcome === "authFailure") return Response.json({ error: { message: "SECRET user transcript data", type: "test", code: "test" } }, { status: outcome === "rateLimit" ? 429 : 401 });
      return Response.json({ id: "test", object: "chat.completion", created: 0, model: "test", choices: [{ index: 0,
        finish_reason: outcome === "length" ? "length" : "stop", message: { role: "assistant", refusal: outcome === "refusal" ? "Refused" : null,
          content: outcome === "invalid" ? "{broken" : null } }] });
    } });
    await assert.rejects(() => createPlanGenerationProvider(testEnv(), { client }).generate(generationInput()), (error: unknown) => {
      assert.ok(error instanceof Error); assert.doesNotMatch(error.message, /SECRET/); return true;
    });
  });
}

test("missing OpenAI key fails closed; fixture generation requires explicit non-production opt-in", async () => {
  await assert.rejects(() => createPlanGenerationProvider(testEnv({ OPENAI_API_KEY: "" })).generate(generationInput()), /OPENAI_API_KEY/);
  const fixture = await createPlanGenerationProvider(testEnv({ OPENAI_API_KEY: "", DEV_PLAN_GENERATION_ENABLED: "true" })).generate(generationInput());
  assert.equal(fixture.generator.provider, "development");
  assert.throws(() => testEnv({ NODE_ENV: "production", SUPADATA_API_KEY: "test", BIBLE_PROVIDER_URL: "https://bible.example.test", DEV_PLAN_GENERATION_ENABLED: "true" }), /Development generation/);
  assert.doesNotThrow(() => testEnv({ NODE_ENV: "production", SUPADATA_API_KEY: "test", BIBLE_PROVIDER_URL: "https://bible.example.test" }));
});
