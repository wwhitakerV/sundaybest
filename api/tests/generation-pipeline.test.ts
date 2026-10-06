import assert from "node:assert/strict";
import test from "node:test";
import { addStagedQuickChecks, generateStagedPlan, type StageEvent } from "../src/generation/pipeline.js";
import { PROMPT_VERSION } from "../src/generation/prompts/version.js";
import { validatePlanStructure } from "../src/generation/validation.js";
import { createBibleProvider } from "../src/providers/bible-provider.js";
import { QUICK_CHECK_QUESTIONS, dayOutput, fakeCaller, finishTheVerseQuestion, generationInput, memoryCheckpoint, quizOutput, sermonQuestion, testEnv } from "./fixtures/generation.js";

const bible = createBibleProvider(testEnv());

test("a one-day plan is assembled from its plan, day, and quiz steps", async () => {
  const input = generationInput(1, true);
  const { caller, calls } = fakeCaller({ quiz: () => ({ ...quizOutput(), questions: [...quizOutput().questions, finishTheVerseQuestion()] }) });
  const plan = await generateStagedPlan(input, { call: caller, bible });
  assert.deepEqual(calls.map((call) => call.stage), ["plan", "day 1", "quiz 1"]);
  assert.equal(plan.generator.provider, "openai");
  assert.equal(plan.generator.model, "test-model");
  assert.equal(plan.generator.promptVersion, PROMPT_VERSION);
  assert.equal(plan.days[0]!.quickCheck!.questions.length, QUICK_CHECK_QUESTIONS + 1);
  assert.equal(plan.days[0]!.quickCheck!.questions.at(-1)!.kind, "finishTheVerse");
  assert.doesNotThrow(() => validatePlanStructure(plan, input));
});

test("every step of a plan sends the same context and cache key, so OpenAI reuses the transcript", async () => {
  const input = generationInput(3, true);
  const { caller, requests } = fakeCaller();
  await generateStagedPlan(input, { call: caller, bible });
  assert.ok(requests.length >= 7);
  assert.equal(new Set(requests.map((request) => request.context)).size, 1);
  assert.deepEqual(new Set(requests.map((request) => request.cacheKey)), new Set([`sermon:${input.sermon.externalId}`]));
});

test("a seven-day plan without Quick Check writes each day separately and no quizzes", async () => {
  const input = generationInput(7, false);
  const { caller, calls } = fakeCaller();
  const plan = await generateStagedPlan(input, { call: caller, bible });
  assert.equal(calls.filter((call) => call.kind === "day").length, 7);
  assert.equal(calls.filter((call) => call.kind === "quiz").length, 0);
  assert.ok(plan.days.every((day) => day.quickCheck === null));
  assert.doesNotThrow(() => validatePlanStructure(plan, input));
});

test("a rejected day is retried on its own, and every call is reported", async () => {
  const events: StageEvent[] = [];
  const { caller, calls } = fakeCaller({ day: (task, call) => task.day!.dayNumber === 2 && call === 1 ? "{broken" : dayOutput(task.day!.dayNumber) });
  await generateStagedPlan(generationInput(2), { call: caller, bible, report: (event) => { events.push(event); } });
  assert.equal(calls.filter((call) => call.kind === "outline").length, 1);
  const day2 = events.filter((event) => event.stage === "day 2");
  assert.deepEqual(day2.map((event) => event.outcome), ["rejected", "accepted"]);
  assert.match(day2[0]!.error!, /invalid JSON/);
  assert.ok(events.every((event) => event.usage !== null));
});

test("a step that keeps failing fails the plan with its reason", async () => {
  const { caller, calls } = fakeCaller({ outline: () => ({ ...JSON.parse(JSON.stringify(fakeOutlineWithActs())) }) });
  await assert.rejects(() => generateStagedPlan(generationInput(), { call: caller, bible }), /Acts 5:1-11 is not named in the transcript/);
  assert.equal(calls.length, 3);
});

test("a response cut off at the token limit is rejected with that reason", async () => {
  const events: StageEvent[] = [];
  const { caller } = fakeCaller();
  const truncating: typeof caller = async (request) => ({ ...await caller(request), finishReason: request.kind === "day" ? "length" : "stop" });
  await assert.rejects(() => generateStagedPlan(generationInput(), { call: truncating, bible, report: (event) => { events.push(event); } }));
  assert.match(events.find((event) => event.stage === "day 1")!.error!, /length/);
});

test("a quiz that falls short keeps its verified questions and asks only for the rest", async () => {
  const tasks: Array<Record<string, unknown>> = [];
  const { caller } = fakeCaller({ quiz: (task, call) => {
    tasks.push(task);
    return call === 1 ? { ...quizOutput(), questions: quizOutput().questions.slice(0, 3) }
      : { ...quizOutput(), questions: Array.from({ length: QUICK_CHECK_QUESTIONS }, (_, index) => sermonQuestion(1, index + 4)) };
  } });
  const plan = await generateStagedPlan(generationInput(1, true), { call: caller, bible });
  const prompts = plan.days[0]!.quickCheck!.questions.map((question) => question.prompt);
  assert.deepEqual(prompts.slice(0, 3), quizOutput().questions.slice(0, 3).map((question) => question.prompt));
  assert.equal(tasks[1]!.questionsNeeded, QUICK_CHECK_QUESTIONS - 3);
  assert.deepEqual(tasks[1]!.avoidPrompts, prompts.slice(0, 3));
});

test("a rejected step is told why when it is asked again", async () => {
  const tasks: Array<Record<string, unknown>> = [];
  const { caller } = fakeCaller({ outline: (task, call) => {
    tasks.push(task);
    return call === 1 ? fakeOutlineWithActs() : undefined;
  } });
  await generateStagedPlan(generationInput(), { call: caller, bible });
  assert.equal(tasks[0]!.previousAttemptsRejected, undefined);
  assert.deepEqual(tasks[1]!.previousAttemptsRejected, ["Day 1's passage Acts 5:1-11 is not named in the transcript"]);
});

test("the plan step is given the chapters the sermon names", async () => {
  const tasks: Array<Record<string, unknown>> = [];
  const { caller } = fakeCaller({ outline: (task) => {
    tasks.push(task);
    return undefined;
  } });
  await generateStagedPlan(generationInput(), { call: caller, bible });
  assert.deepEqual(tasks[0]!.namedChapters, ["John 3", "Psalm 23", "Ephesians 2"]);
});

test("a sermon that names no chapter fails before any model call", async () => {
  const input = generationInput();
  input.transcriptSegments = [{ startMs: 0, endMs: 30_000, text: "Love one another." }];
  input.transcript = "Love one another.";
  const { caller, calls } = fakeCaller();
  await assert.rejects(() => generateStagedPlan(input, { call: caller, bible }), /names no chapter/);
  assert.equal(calls.length, 0);
});

test("a re-run resumes from the steps an earlier run finished", async () => {
  const checkpoint = memoryCheckpoint();
  const failing = fakeCaller({ day: (task) => task.day!.dayNumber === 3 ? "{broken" : dayOutput(task.day!.dayNumber) });
  await assert.rejects(() => generateStagedPlan(generationInput(3, true), { call: failing.caller, bible, checkpoint }));
  const events: StageEvent[] = [];
  const rerun = fakeCaller();
  const plan = await generateStagedPlan(generationInput(3, true), { call: rerun.caller, bible, checkpoint, report: (event) => { events.push(event); } });
  assert.deepEqual(rerun.calls.map((call) => call.stage), ["day 3", "quiz 1", "quiz 2", "quiz 3"]);
  assert.deepEqual(events.filter((event) => event.outcome === "resumed").map((event) => event.stage), ["plan", "day 1", "day 2"]);
  assert.doesNotThrow(() => validatePlanStructure(plan, generationInput(3, true)));
});

test("quizzes are added to a finished plan without rewriting its days", async () => {
  const withoutQuizzes = await generateStagedPlan(generationInput(2, false), { call: fakeCaller().caller, bible });
  const { caller, calls } = fakeCaller();
  const plan = await addStagedQuickChecks(generationInput(2, true), withoutQuizzes, { call: caller, bible });
  assert.deepEqual(calls.map((call) => call.kind), ["quiz", "quiz"]);
  assert.deepEqual(plan.days.map((day) => day.readingParagraphs), withoutQuizzes.days.map((day) => day.readingParagraphs));
  assert.ok(plan.days.every((day) => day.quickCheck!.questions.length >= QUICK_CHECK_QUESTIONS));
  assert.doesNotThrow(() => validatePlanStructure(plan, generationInput(2, true)));
});

test("a reflection repeated on a later day is rewritten for that day", async () => {
  const { caller } = fakeCaller({ day: (task, call) => ({ ...dayOutput(task.day!.dayNumber),
    reflections: [task.day!.dayNumber === 2 && call === 1 ? "Reflection for day 1?" : `Reflection for day ${task.day!.dayNumber}?`] }) });
  const plan = await generateStagedPlan(generationInput(2), { call: caller, bible });
  assert.deepEqual(plan.days.map((day) => day.reflections), [["Reflection for day 1?"], ["Reflection for day 2?"]]);
});

test("a quiz question repeated on a later day is left out, and the quiz rewritten if that leaves it short", async () => {
  const { caller } = fakeCaller({ quiz: (_task, call) => call === 1 ? quizOutput(1) : quizOutput(9) });
  const plan = await generateStagedPlan(generationInput(2, true), { call: caller, bible });
  const prompts = plan.days.flatMap((day) => day.quickCheck!.questions.map((question) => question.prompt));
  assert.equal(new Set(prompts).size, prompts.length);
});

test("a passage with no text in a bundled translation fails the plan step", async () => {
  const quote = "Turn to Matthew chapter seventeen verse twenty-one.";
  const input = generationInput();
  input.transcriptSegments = [{ startMs: 0, endMs: 30_000, text: quote }];
  input.transcript = quote;
  const outline = { ...fakeOutlineWithActs(), days: [{ dayNumber: 1, title: "Day 1", focus: "Focus.", scripture: { book: "Matthew", chapter: 17, verseStart: 21, verseEnd: 21, reference: "Matthew 17:21" } }] };
  const { caller } = fakeCaller({ outline: () => outline });
  await assert.rejects(() => generateStagedPlan(input, { call: caller, bible }), /BSB/);
});

function fakeOutlineWithActs() {
  return {
    title: "God's love",
    about: { overview: ["Overview."], keyTakeaways: ["Takeaway."], scripturesReferenced: [] },
    days: [{ dayNumber: 1, title: "Day 1", focus: "Focus.", scripture: { book: "Acts", chapter: 5, verseStart: 1, verseEnd: 11, reference: "Acts 5:1-11" } }],
  };
}
