import assert from "node:assert/strict";
import test from "node:test";
import { generateStagedPlan } from "../src/generation/pipeline.js";
import { DAY_INSTRUCTIONS } from "../src/generation/prompts/day.js";
import { FORMATION_INSTRUCTIONS } from "../src/generation/prompts/formation.js";
import { OUTLINE_INSTRUCTIONS } from "../src/generation/prompts/outline.js";
import { QUIZ_INSTRUCTIONS } from "../src/generation/prompts/quiz.js";
import { canonicalizeScripture, referenceIsNamed } from "../src/generation/scripture.js";
import { containsExcerpt, formatTranscript, normalizeTranscript } from "../src/generation/transcript.js";
import { validateGeneratedContent, validatePlanStructure } from "../src/generation/validation.js";
import { createBibleProvider } from "../src/providers/bible-provider.js";
import { createPlanGenerationProvider } from "../src/providers/plan-generation-provider.js";
import { fakeCaller, finishTheVerseQuestion, generationInput, quizOutput, testEnv } from "./fixtures/generation.js";

const bible = createBibleProvider(testEnv());
const plan = (days = 1, quickCheck = false, quiz?: () => unknown) =>
  generateStagedPlan(generationInput(days, quickCheck), { call: fakeCaller(quiz ? { quiz } : {}).caller, bible });

test("timestamp blocks preserve source offsets, sort captions, and never invent timing", () => {
  assert.equal(formatTranscript([{ startMs: 31000, endMs: 32000, text: "Two" }, { startMs: 1000, endMs: 2000, text: " One  " }]), "[b1 00:00:01] One\n\n[b2 00:00:31] Two");
  assert.equal(formatTranscript([{ startMs: 0, endMs: null, text: "Untimed" }]), "[TIMING UNAVAILABLE]\n\n[b1] Untimed");
  assert.throws(() => normalizeTranscript([{ startMs: 20, endMs: 10, text: "Invalid" }]));
  assert.throws(() => normalizeTranscript([{ startMs: 0, endMs: null, text: "  " }]));
});

test("Scripture references are recognised whether written as numbers or spoken", () => {
  const scripture = canonicalizeScripture({ book: "1 John", chapter: 3, verseStart: 16, verseEnd: 18, reference: "1 John 3:16-18" });
  assert.equal(referenceIsNamed("First John chapter three verses sixteen through eighteen", scripture), true);
  assert.equal(referenceIsNamed("1 John 3:16-18", scripture), true);
  assert.equal(referenceIsNamed("1 John chapter 3", scripture), true);
  assert.equal(referenceIsNamed("John 3:16-18", scripture), false);
});

test("excerpts match on their words, ignoring punctuation and case", () => {
  const caption = "God loved the world and gave His Son. Reflect on that love";
  assert.equal(containsExcerpt(caption, "god loved the world, and gave his son!"), true);
  assert.equal(containsExcerpt(caption, "“gave His Son.” Reflect"), true);
  assert.equal(containsExcerpt(caption, "loved the worlds"), false);
  assert.equal(containsExcerpt(caption, "the world gave His Son"), false);
  assert.equal(containsExcerpt(caption, " , "), false);
});

type Plan = Awaited<ReturnType<typeof plan>>;
for (const [name, days, quickCheck, mutate] of [
  ["the wrong day count", 1, false, (p: Plan) => { p.days.push({ ...p.days[0]!, dayNumber: 2 }); }],
  ["a blank reading", 1, false, (p: Plan) => { p.days[0]!.readingParagraphs = [{ heading: " ", content: " " }]; }],
  ["an out-of-range clip", 1, false, (p: Plan) => { p.days[0]!.clipEndSeconds = 10_000; }],
  ["overlapping passages", 2, false, (p: Plan) => { p.days[1]!.scripture = { ...p.days[1]!.scripture, verseStart: 16, verseEnd: 17, reference: "John 3:16-17" }; }],
  ["a quiz when Quick Check is off", 1, false, (p: Plan) => { p.days[0]!.quickCheck = { title: "Quiz", questions: [] }; }],
  ["a missing quiz when Quick Check is on", 1, true, (p: Plan) => { p.days[0]!.quickCheck = null; }],
  ["fewer than seven questions", 1, true, (p: Plan) => { p.days[0]!.quickCheck!.questions.pop(); }],
  ["three choices", 1, true, (p: Plan) => { p.days[0]!.quickCheck!.questions[0]!.choices.pop(); }],
  ["repeated choices", 1, true, (p: Plan) => { p.days[0]!.quickCheck!.questions[0]!.choices[1]!.text = p.days[0]!.quickCheck!.questions[0]!.choices[0]!.text; }],
  ["two correct answers", 1, true, (p: Plan) => { p.days[0]!.quickCheck!.questions[0]!.choices[1]!.correct = true; }],
  ["a repeated prompt", 1, true, (p: Plan) => { p.days[0]!.quickCheck!.questions[1]!.prompt = p.days[0]!.quickCheck!.questions[0]!.prompt; }],
] as const) test(`the final check rejects ${name}`, async () => {
  const input = generationInput(days, quickCheck);
  const generated = await plan(days, quickCheck);
  mutate(generated);
  assert.throws(() => validatePlanStructure(generated, input));
});

test("the final check rejects finish the verse without both translations or outside the day's passage", async () => {
  const input = generationInput(1, true);
  const withVerse = () => plan(1, true, () => ({ ...quizOutput(), questions: [...quizOutput().questions, finishTheVerseQuestion()] }));
  const missing = await withVerse();
  missing.days[0]!.quickCheck!.questions.find((question) => question.kind === "finishTheVerse")!.variants = null;
  assert.throws(() => validatePlanStructure(missing, input), /both translations/);
  const elsewhere = await withVerse();
  elsewhere.days[0]!.quickCheck!.questions.find((question) => question.kind === "finishTheVerse")!.scriptureReference = "John 3:20";
  assert.throws(() => validatePlanStructure(elsewhere, input), /day's passage/);
});

test("Bible validation checks each day's passage and rejects incomplete ranges", async () => {
  const input = generationInput(7);
  const generated = await plan(7);
  let calls = 0;
  const counting = { bundledTranslations: ["KJV"] as const, servesLocally: () => true,
    async getPassage({ reference }: { reference: string }) {
      calls++;
      return { reference, translation: "KJV" as const, provider: "test", cacheAllowed: false, verses: [{ number: Number(reference.split(":")[1]), text: "Test verse text" }] };
    } };
  await validateGeneratedContent(generated, input, counting);
  assert.equal(calls, 7);
  await assert.rejects(() => validateGeneratedContent(generated, input, { ...counting, async getPassage() { return { reference: "John 3:16", translation: "KJV" as const, provider: "test", cacheAllowed: false, verses: [{ number: 99, text: "Wrong verse" }] }; } }), /complete requested/);
});

test("supporting Scripture without text in every bundled translation is left out", async () => {
  const input = generationInput();
  const generated = await plan();
  const romans5 = { book: "Romans", chapter: 5, verseStart: 8, verseEnd: 8, reference: "Romans 5:8", connection: "God's love came first." };
  generated.days[0]!.supportingScriptures = [romans5, { ...romans5, verseStart: 99, verseEnd: 99, reference: "Romans 5:99" }];
  const verified = await validateGeneratedContent(generated, input, bible);
  assert.deepEqual(verified.days[0]!.supportingScriptures.map((passage) => passage.reference), ["Romans 5:8"]);
});

const sections = (instructions: string) => instructions.split("\n\n---\n\n").map((section) => section.split("\n")[0]);
const VOICE_OPENING = "Never refer to the speaker of the scripture, author, writer, apostle etc by anything other than their actual name.";

test("each step's prompt is what the step is, the voice, its rules, then its output", () => {
  assert.deepEqual(sections(OUTLINE_INSTRUCTIONS).map((line) => line?.slice(0, 20)), ["# THIS STEP: THE PLA", VOICE_OPENING.slice(0, 20), "# RULES", "# OUTPUT FIELDS"]);
  assert.deepEqual(sections(DAY_INSTRUCTIONS).map((line) => line?.slice(0, 20)), ["# THIS STEP: ONE DAY", VOICE_OPENING.slice(0, 20), "# RULES", "# OUTPUT FIELDS"]);
  assert.deepEqual(sections(QUIZ_INSTRUCTIONS).map((line) => line?.slice(0, 20)), ["# THIS STEP: ONE DAY", VOICE_OPENING.slice(0, 20), "# RULES", "# FINISH THE VERSE", "# OUTPUT FIELDS"]);
  assert.deepEqual(sections(FORMATION_INSTRUCTIONS).map((line) => line?.slice(0, 20)), ["# THIS STEP: ONE DAY", VOICE_OPENING.slice(0, 20), "# RULES", "# HOW TO WRITE THE D", "# OUTPUT FIELDS"]);
});

test("every step's voice is the custom prompt, whole", () => {
  for (const instructions of [OUTLINE_INSTRUCTIONS, DAY_INSTRUCTIONS, QUIZ_INSTRUCTIONS, FORMATION_INSTRUCTIONS]) {
    assert.match(instructions, /Use the exact tone, voice, semantic, linguistic detail, intonation, and all other writing cues exactly as they appear in the transcript\./);
    assert.match(instructions, /You aren't talking in third person\./);
    assert.match(instructions, /It is as if the you already are the pastor and you're speaking directly to someone if they asked you/);
    assert.match(instructions, /Be a discipler, be a pastor, be direct\./);
    assert.doesNotMatch(instructions, /Never write as the pastor/);
  }
});

test("only the plan step is told the overview must say what the plan is about", () => {
  assert.match(OUTLINE_INSTRUCTIONS, /The reader of this overview should understand exactly what the plan is about\./);
  for (const instructions of [DAY_INSTRUCTIONS, QUIZ_INSTRUCTIONS, FORMATION_INSTRUCTIONS]) {
    assert.doesNotMatch(instructions, /The reader of this overview/);
  }
});

test("no step makes up the pastor's stories", () => {
  for (const instructions of [OUTLINE_INSTRUCTIONS, DAY_INSTRUCTIONS, FORMATION_INSTRUCTIONS]) {
    assert.match(instructions, /Never make up personal stories or experiences/);
  }
});

test("each step's voice answers the reader's own question", () => {
  assert.match(OUTLINE_INSTRUCTIONS, /if they asked you "What is this plan about"/);
  assert.match(DAY_INSTRUCTIONS, /if they asked you "What are we covering today\? How can I apply it\? How does the scripture tie into this\? Talk to me\."/);
  assert.match(QUIZ_INSTRUCTIONS, /if they asked you "Can you test my knowledge on what was discussed today\?"/);
});

test("no step may add Scripture or leave out what the sermon gives", () => {
  for (const instructions of [OUTLINE_INSTRUCTIONS, DAY_INSTRUCTIONS, FORMATION_INSTRUCTIONS]) {
    assert.match(instructions, /Never invent Scripture/);
  }
  assert.match(OUTLINE_INSTRUCTIONS, /Never leave out any Scripture, teaching, warning, promise, or call to action the sermon gives/);
  assert.doesNotMatch(DAY_INSTRUCTIONS, /supportingScriptures/);
});

test("missing OpenAI key fails closed; fixture generation requires explicit non-production opt-in", async () => {
  await assert.rejects(() => createPlanGenerationProvider(testEnv({ OPENAI_API_KEY: "" })).generate(generationInput()), /OPENAI_API_KEY/);
  const fixture = await createPlanGenerationProvider(testEnv({ OPENAI_API_KEY: "", DEV_PLAN_GENERATION_ENABLED: "true" })).generate(generationInput());
  assert.equal(fixture.generator.provider, "development");
  assert.throws(() => testEnv({ NODE_ENV: "production", SUPADATA_API_KEY: "test", DEV_PLAN_GENERATION_ENABLED: "true" }), /Development generation/);
  assert.doesNotThrow(() => testEnv({ NODE_ENV: "production", SUPADATA_API_KEY: "test" }));
});
