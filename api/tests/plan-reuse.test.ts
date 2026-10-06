import assert from "node:assert/strict";
import test from "node:test";
import { SEARCH_HIT, apiHarness } from "./fixtures/api-harness.js";
import { generationInput } from "./fixtures/generation.js";

type Harness = Awaited<ReturnType<typeof apiHarness>>;
type Reader = Awaited<ReturnType<Harness["user"]>>;

async function build(harness: Harness, reader: Reader, sermonId: string, lengthDays: number, quickCheckEnabled: boolean) {
  const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays, quickCheckEnabled });
  assert.equal(created.statusCode, 200, created.body);
  const ids: { planId: string; generationId: string } = created.json();
  await harness.worker.runOnce();
  const status = await reader.get(`/v1/plan-generations/${ids.generationId}`);
  assert.equal(status.json().generation.status, "completed", status.body);
  return ids;
}

test("a known sermon link and a recent search term cost no Supadata calls", async () => {
  const harness = await apiHarness();
  try {
    const reader = await harness.user("supadata-reader");
    const sermonId = await harness.resolveSermon(reader);
    const again = await reader.mutate("POST", "/v1/sermons/resolve", { url: `https://youtu.be/${generationInput().sermon.externalId}` });
    assert.equal(again.json().sermon.id, sermonId, again.body);
    assert.equal(harness.counts.metadata, 1);
    for (const query of ["Grace", " grace  "]) {
      const found = await reader.get(`/v1/sermons/search?q=${encodeURIComponent(query)}`);
      assert.ok(found.json().sermons.some((sermon: { externalId: string }) => sermon.externalId === SEARCH_HIT), found.body);
    }
    assert.equal(harness.counts.searches, 1);
  } finally {
    await harness.close();
  }
});

test("a finished plan is reused for the same sermon and length, with or without its quizzes", async () => {
  const harness = await apiHarness();
  const { counts, content, pg } = harness;
  try {
    const author = await harness.user("reuse-author");
    const sermonId = await harness.resolveSermon(author);
    const original = await build(harness, author, sermonId, 1, true);
    const calls = counts.openai;

    // Quick Check off: the same days, quizzes dropped, no provider calls.
    const withoutQuiz = await build(harness, await harness.user("reuse-no-quiz"), sermonId, 1, false);
    assert.equal(counts.openai, calls);
    const copied = await content(withoutQuiz.planId);
    const source = await content(original.planId);
    assert.deepEqual(copied.days, source.days);
    assert.deepEqual(copied.plan, source.plan);
    assert.deepEqual(copied.quiz, []);
    const [log] = (await pg.query("select stage, outcome, prompt_tokens from generation_attempts where generation_id = $1", [withoutQuiz.generationId])).rows;
    assert.deepEqual(log, { stage: "reused", outcome: "completed", prompt_tokens: 0 });

    // Quick Check on, but only a plan without quizzes exists: its days are kept and only the quizzes are written.
    const sevenDays = await build(harness, await harness.user("reuse-seven"), sermonId, 7, false);
    const beforeQuizzes = counts.openai;
    const withQuizzes = await build(harness, await harness.user("reuse-seven-quiz"), sermonId, 7, true);
    assert.equal(counts.openai, beforeQuizzes + 7);
    assert.equal(counts.transcripts, 1);
    assert.deepEqual((await content(withQuizzes.planId)).days, (await content(sevenDays.planId)).days);
    assert.equal(new Set((await content(withQuizzes.planId)).quiz.map((row) => row.day_number)).size, 7);
  } finally {
    await harness.close();
  }
});

test("a plan written by an earlier prompt is not reused", async () => {
  const harness = await apiHarness();
  try {
    const author = await harness.user("retired-author");
    const sermonId = await harness.resolveSermon(author);
    await build(harness, author, sermonId, 1, false);
    await harness.pg.query("update plan_generations set prompt_version = 'retired'");
    const calls = harness.counts.openai;
    await build(harness, await harness.user("retired-reader"), sermonId, 1, false);
    assert.equal(harness.counts.openai, calls + 2);
  } finally {
    await harness.close();
  }
});

test("a reader asking again for a sermon they already have gets their existing plan", async () => {
  const harness = await apiHarness();
  try {
    const reader = await harness.user("one-plan-reader");
    const sermonId = await harness.resolveSermon(reader);
    const existing = await build(harness, reader, sermonId, 1, true);
    const repeat = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 7, quickCheckEnabled: false });
    assert.equal(repeat.statusCode, 200, repeat.body);
    assert.deepEqual(repeat.json(), existing);
    assert.equal(await harness.worker.runOnce(), false);
  } finally {
    await harness.close();
  }
});

test("a reader whose plan for a sermon failed can make a new one", async () => {
  const harness = await apiHarness();
  try {
    const reader = await harness.user("failed-reader");
    const sermonId = await harness.resolveSermon(reader);
    harness.flags.invalidOutput = true;
    const failed = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 1, quickCheckEnabled: false });
    await harness.worker.runOnce();
    harness.flags.invalidOutput = false;
    const fresh = await build(harness, reader, sermonId, 1, false);
    assert.notEqual(fresh.planId, failed.json().planId);
  } finally {
    await harness.close();
  }
});
