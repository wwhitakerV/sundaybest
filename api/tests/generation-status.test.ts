import assert from "node:assert/strict";
import test from "node:test";
import { apiHarness } from "./fixtures/api-harness.js";

type Harness = Awaited<ReturnType<typeof apiHarness>>;

async function create(harness: Harness, installationId: string, lengthDays = 2) {
  const reader = await harness.user(installationId);
  const sermonId = await harness.resolveSermon(reader);
  const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays, quickCheckEnabled: true });
  assert.equal(created.statusCode, 200, created.body);
  return { reader, sermonId, ids: created.json() as { planId: string; generationId: string } };
}

test("each step runs under its own status, and progress only moves forward to 100", async () => {
  const harness = await apiHarness();
  try {
    const seen: Array<{ step: string; status: string; progress: number }> = [];
    harness.flags.onOpenAiCall = async (step) => {
      const [row] = (await harness.pg.query<{ status: string; progress: number }>("select status, progress from plan_generations order by created_at desc limit 1")).rows;
      seen.push({ step, status: row!.status, progress: row!.progress });
    };
    const { reader, ids } = await create(harness, "status-reader");
    await harness.worker.runOnce();
    assert.deepEqual(seen.map(({ step, status }) => [step, status]), [
      ["sundaybest_plan", "findingScripture"],
      ["sundaybest_day", "writingDays"], ["sundaybest_day", "writingDays"],
      ["sundaybest_quiz", "buildingQuiz"], ["sundaybest_quiz", "buildingQuiz"],
    ]);
    const progress = seen.map((call) => call.progress);
    assert.ok(progress.every((value, index) => index === 0 || value >= progress[index - 1]!), progress.join(","));
    assert.ok(progress[0]! > 0);
    const done = await reader.get(`/v1/plan-generations/${ids.generationId}`);
    assert.equal(done.json().generation.progress, 100, done.body);
  } finally {
    await harness.close();
  }
});

test("a reader's current builds stay listed until dismissed, finished or not", async () => {
  const harness = await apiHarness();
  try {
    const { reader, ids } = await create(harness, "current-reader");
    const building = await reader.get("/v1/plan-generations/current");
    assert.deepEqual(building.json().generations.map((generation: { id: string }) => generation.id), [ids.generationId], building.body);
    await harness.worker.runOnce();
    const ready = await reader.get("/v1/plan-generations/current");
    assert.equal(ready.json().generations[0].status, "completed", ready.body);
    for (let time = 0; time < 2; time++) {
      const dismissed = await reader.mutate("POST", `/v1/plan-generations/${ids.generationId}/dismiss`);
      assert.equal(dismissed.statusCode, 200, dismissed.body);
    }
    assert.deepEqual((await reader.get("/v1/plan-generations/current")).json().generations, []);
  } finally {
    await harness.close();
  }
});

test("asking again for a sermon you already have brings its plan back as ready", async () => {
  const harness = await apiHarness();
  try {
    const { reader, sermonId, ids } = await create(harness, "again-reader");
    await harness.worker.runOnce();
    await reader.mutate("POST", `/v1/plan-generations/${ids.generationId}/dismiss`);
    const again = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 2, quickCheckEnabled: true });
    assert.deepEqual(again.json(), ids);
    const current = (await reader.get("/v1/plan-generations/current")).json().generations;
    assert.deepEqual(current.map((generation: { id: string; status: string }) => [generation.id, generation.status]), [[ids.generationId, "completed"]]);
  } finally {
    await harness.close();
  }
});
