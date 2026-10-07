import assert from "node:assert/strict";
import test from "node:test";
import { getStudyDayResponseSchema } from "../src/contracts/index.js";
import { apiHarness } from "./fixtures/api-harness.js";

async function startedPlan(harness: Awaited<ReturnType<typeof apiHarness>>, installationId: string) {
  const reader = await harness.user(installationId);
  const sermonId = await harness.resolveSermon(reader);
  const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 1, quickCheckEnabled: false });
  const { planId } = created.json() as { planId: string };
  await harness.worker.runOnce();
  const started = await reader.mutate("POST", `/v1/plans/${planId}/start`);
  assert.equal(started.statusCode, 200, started.body);
  return { reader, planId };
}

test("a day's reading reaches the app as headed paragraphs", async () => {
  const harness = await apiHarness();
  try {
    const { reader, planId } = await startedPlan(harness, "headed-reader");
    const study = await reader.get(`/v1/plans/${planId}/days/1`);
    const day = getStudyDayResponseSchema.parse(study.json()).day;
    assert.deepEqual(day.reading.paragraphs, [
      { heading: "Love That Gives", content: "God's love is demonstrated in giving His Son. Study emphasis 1." },
    ]);
  } finally {
    await harness.close();
  }
});

test("a plan written before headings reads as it was — no heading, and its stored text untouched", async () => {
  const harness = await apiHarness();
  try {
    const { reader, planId } = await startedPlan(harness, "legacy-reader");
    const legacy = ["Read: When disappointment leaves us spiritually thirsty", "Psalm 42 opens with longing."];
    await harness.pg.query("update plan_days set reading_paragraphs = $1 where plan_id = $2", [JSON.stringify(legacy), planId]);

    const study = await reader.get(`/v1/plans/${planId}/days/1`);
    const day = getStudyDayResponseSchema.parse(study.json()).day;
    assert.deepEqual(day.reading.paragraphs, legacy.map((content) => ({ heading: null, content })));
    const detail = await reader.get(`/v1/plans/${planId}`);
    assert.equal(detail.statusCode, 200, detail.body);

    const { rows } = await harness.pg.query<{ reading_paragraphs: unknown }>("select reading_paragraphs from plan_days where plan_id = $1", [planId]);
    assert.deepEqual(rows[0]?.reading_paragraphs, legacy);
  } finally {
    await harness.close();
  }
});
