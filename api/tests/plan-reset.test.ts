import assert from "node:assert/strict";
import test from "node:test";
import { getPlanResponseSchema, resetPlanResponseSchema } from "../src/contracts/index.js";
import { apiHarness } from "./fixtures/api-harness.js";

type Harness = Awaited<ReturnType<typeof apiHarness>>;

/** A reader part-way through a plan: started, its day's steps done, its Quick Check begun. */
async function underWay(harness: Harness, installationId: string) {
  const reader = await harness.user(installationId);
  const sermonId = await harness.resolveSermon(reader);
  const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 1, quickCheckEnabled: true });
  const { planId } = created.json() as { planId: string };
  await harness.worker.runOnce();
  assert.equal((await reader.mutate("POST", `/v1/plans/${planId}/start`)).statusCode, 200);
  for (const step of ["read", "scripture", "reflect", "pray"]) {
    const done = await reader.mutate("PUT", `/v1/plans/${planId}/days/1/steps/${step}`, { step });
    assert.equal(done.statusCode, 200, done.body);
  }
  const plan = getPlanResponseSchema.parse((await reader.get(`/v1/plans/${planId}`)).json()).plan;
  const attempt = await reader.mutate("POST", `/v1/quizzes/${plan.days[0]!.quickCheckId}/attempts`);
  assert.equal(attempt.statusCode, 200, attempt.body);
  return { reader, planId };
}

test("resetting a plan takes it back to not started, its progress and quizzes cleared", async () => {
  const harness = await apiHarness();
  try {
    const { reader, planId } = await underWay(harness, "reset-reader");

    const reset = await reader.mutate("POST", `/v1/plans/${planId}/reset`);
    assert.equal(reset.statusCode, 200, reset.body);
    const body = resetPlanResponseSchema.parse(reset.json());
    assert.equal(body.plan.status, "ready");
    // The plan's reflection questions, so the app can clear the answers it keeps on the phone.
    const { rows: prompts } = await harness.pg.query<{ id: string }>(
      "select reflection_prompts.id from reflection_prompts join plan_days on plan_days.id = reflection_prompts.plan_day_id where plan_days.plan_id = $1",
      [planId],
    );
    assert.deepEqual([...body.reflectionIds].sort(), prompts.map((row) => row.id).sort());
    assert.ok(body.reflectionIds.length > 0);

    const plan = getPlanResponseSchema.parse((await reader.get(`/v1/plans/${planId}`)).json()).plan;
    assert.equal(plan.status, "ready");
    assert.equal(plan.progress.completedDays, 0);
    assert.deepEqual(plan.days[0]!.progress.completedSteps, []);
    const { rows } = await harness.pg.query<{ count: number }>("select count(*)::int as count from quiz_attempts");
    assert.equal(rows[0]?.count, 0);
  } finally {
    await harness.close();
  }
});

test("resetting a plan never touches what the plan says", async () => {
  const harness = await apiHarness();
  try {
    const { reader, planId } = await underWay(harness, "reset-content-reader");
    const before = await harness.content(planId);

    await reader.mutate("POST", `/v1/plans/${planId}/reset`);

    assert.deepEqual(await harness.content(planId), before);
  } finally {
    await harness.close();
  }
});

test("a reset plan can be started again", async () => {
  const harness = await apiHarness();
  try {
    const { reader, planId } = await underWay(harness, "restart-reader");
    await reader.mutate("POST", `/v1/plans/${planId}/reset`);

    const again = await reader.mutate("POST", `/v1/plans/${planId}/start`);
    assert.equal(again.statusCode, 200, again.body);
    const plan = getPlanResponseSchema.parse((await reader.get(`/v1/plans/${planId}`)).json()).plan;
    assert.equal(plan.status, "active");
  } finally {
    await harness.close();
  }
});

test("only the reader whose plan it is can reset it", async () => {
  const harness = await apiHarness();
  try {
    const { planId } = await underWay(harness, "owner-reader");
    const stranger = await harness.user("stranger-reader");

    const reset = await stranger.mutate("POST", `/v1/plans/${planId}/reset`);
    assert.equal(reset.statusCode, 404, reset.body);
  } finally {
    await harness.close();
  }
});
