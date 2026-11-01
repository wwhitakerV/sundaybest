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
    assert.equal(harness.counts.openai, calls + 3);
  } finally {
    await harness.close();
  }
});

test("a reader asking again for a sermon they already have gets a second plan, written fresh", async () => {
  const harness = await apiHarness();
  try {
    const reader = await harness.user("duplicate-reader");
    const sermonId = await harness.resolveSermon(reader);
    const first = await build(harness, reader, sermonId, 1, false);
    const calls = harness.counts.openai;
    const before = await harness.content(first.planId);

    const second = await build(harness, reader, sermonId, 1, false);

    assert.notEqual(second.planId, first.planId);
    // Written by the model again — never copied from the reader's own plan.
    assert.equal(harness.counts.openai, calls + 3);
    // The first plan's content is left exactly as it was.
    assert.deepEqual(await harness.content(first.planId), before);
  } finally {
    await harness.close();
  }
});

test("a reader asking again while their plan for the sermon is still being built gets that one", async () => {
  const harness = await apiHarness();
  try {
    const reader = await harness.user("building-reader");
    const sermonId = await harness.resolveSermon(reader);
    const building = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 1, quickCheckEnabled: false });
    const repeat = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 1, quickCheckEnabled: false });

    assert.equal(repeat.statusCode, 200, repeat.body);
    assert.deepEqual(repeat.json(), building.json());
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

/** The response schemas of every model call the harness answers from here on. */
function recordSteps(harness: Harness): string[] {
  const steps: string[] = [];
  harness.flags.onOpenAiCall = async (step) => { steps.push(step); };
  return steps;
}

test("another length of a sermon keeps its points and writes only its days", async () => {
  const harness = await apiHarness();
  try {
    const author = await harness.user("points-author");
    const sermonId = await harness.resolveSermon(author);
    const threeDays = await build(harness, author, sermonId, 3, false);
    const steps = recordSteps(harness);
    const twoDays = await build(harness, await harness.user("points-reader"), sermonId, 2, false);
    assert.deepEqual(steps.filter((step) => step.startsWith("sundaybest_plan")), ["sundaybest_plan_days"]);
    const kept = (await harness.content(twoDays.planId)).plan;
    const source = (await harness.content(threeDays.planId)).plan;
    assert.deepEqual(kept, source);
  } finally {
    await harness.close();
  }
});

test("a reader's own plan at another length finds the sermon's points fresh", async () => {
  const harness = await apiHarness();
  try {
    const reader = await harness.user("points-again");
    const sermonId = await harness.resolveSermon(reader);
    await build(harness, reader, sermonId, 3, false);
    const steps = recordSteps(harness);
    await build(harness, reader, sermonId, 2, false);
    assert.ok(steps.includes("sundaybest_plan"), steps.join(", "));
  } finally {
    await harness.close();
  }
});

test("points kept by an earlier prompt are not reused", async () => {
  const harness = await apiHarness();
  try {
    const author = await harness.user("points-retired");
    const sermonId = await harness.resolveSermon(author);
    await build(harness, author, sermonId, 3, false);
    await harness.pg.query("update sermon_inventories set prompt_version = 'retired'");
    const steps = recordSteps(harness);
    await build(harness, await harness.user("points-later"), sermonId, 2, false);
    assert.ok(steps.includes("sundaybest_plan"), steps.join(", "));
  } finally {
    await harness.close();
  }
});

/** A plan asked for but not yet built: its job held back until `release`. */
async function holdBack(harness: Harness, reader: Reader, sermonId: string, lengthDays: number) {
  const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays, quickCheckEnabled: false });
  assert.equal(created.statusCode, 200, created.body);
  const ids: { planId: string; generationId: string } = created.json();
  await harness.pg.query("update generation_jobs set available_at = now() + interval '1 hour' where generation_id = $1", [ids.generationId]);
  return { ...ids, release: () => harness.pg.query("update generation_jobs set available_at = now() where generation_id = $1", [ids.generationId]) };
}

test("a plan another reader's build of the same sermon and length is under way for waits for it, then copies it", async () => {
  const harness = await apiHarness();
  try {
    const first = await harness.user("building-first");
    const sermonId = await harness.resolveSermon(first);
    const building = await holdBack(harness, first, sermonId, 2);
    const waiting = await (await harness.user("building-second")).mutate("POST", "/v1/plans", { sermonId, lengthDays: 2, quickCheckEnabled: false });
    const { generationId } = waiting.json();

    const calls = harness.counts.openai;
    assert.equal(await harness.worker.runOnce(), true);
    assert.equal(harness.counts.openai, calls);
    const [job] = (await harness.pg.query<{ status: string; attempts: number; later: boolean }>("select status, attempts, available_at > now() as later from generation_jobs where generation_id = $1", [generationId])).rows;
    assert.deepEqual(job, { status: "queued", attempts: 0, later: true });

    await building.release();
    await harness.worker.runOnce();
    const built = harness.counts.openai;
    await harness.pg.query("update generation_jobs set available_at = now() where generation_id = $1", [generationId]);
    await harness.worker.runOnce();
    assert.equal(harness.counts.openai, built);
    const log = (await harness.pg.query("select stage from generation_attempts where generation_id = $1 and stage <> 'title'", [generationId])).rows;
    assert.deepEqual(log, [{ stage: "reused" }]);
  } finally {
    await harness.close();
  }
});

test("a plan that has waited long on another reader's build writes its own", async () => {
  const harness = await apiHarness();
  try {
    const first = await harness.user("stuck-first");
    const sermonId = await harness.resolveSermon(first);
    const stuck = await holdBack(harness, first, sermonId, 2);
    const waiting = await (await harness.user("stuck-second")).mutate("POST", "/v1/plans", { sermonId, lengthDays: 2, quickCheckEnabled: false });
    await harness.pg.query("update plan_generations set created_at = now() - interval '11 minutes' where id = $1", [stuck.generationId]);
    await harness.pg.query("update plan_generations set created_at = now() - interval '10 minutes' where id = $1", [waiting.json().generationId]);

    const calls = harness.counts.openai;
    await harness.worker.runOnce();
    assert.ok(harness.counts.openai > calls);
    const status = await harness.pg.query<{ status: string }>("select status from plan_generations where id = $1", [waiting.json().generationId]);
    assert.equal(status.rows[0]!.status, "completed");
  } finally {
    await harness.close();
  }
});

test("two plans of a new sermon built at once fetch its transcript once", async () => {
  const harness = await apiHarness();
  try {
    const first = await harness.user("together-first");
    const sermonId = await harness.resolveSermon(first);
    await first.mutate("POST", "/v1/plans", { sermonId, lengthDays: 1, quickCheckEnabled: false });
    await (await harness.user("together-second")).mutate("POST", "/v1/plans", { sermonId, lengthDays: 2, quickCheckEnabled: false });
    await Promise.all([harness.worker.runOnce(), harness.worker.runOnce()]);
    assert.equal(harness.counts.transcripts, 1);
  } finally {
    await harness.close();
  }
});
