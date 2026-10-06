import assert from "node:assert/strict";
import test from "node:test";
import { apiHarness } from "./fixtures/api-harness.js";

test("a video that does not teach from the Bible fails before any model call, saying why", async () => {
  const harness = await apiHarness();
  try {
    harness.flags.transcript = ["Welcome back to the channel, today we are building a spear only base.", "Like John 3:16 says, believe in yourself and never quit."];
    const reader = await harness.user("gate-reader");
    const sermonId = await harness.resolveSermon(reader);
    const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays: 3, quickCheckEnabled: true });
    await harness.worker.runOnce();
    const status = await reader.get(`/v1/plan-generations/${created.json().generationId}`);
    const { generation } = status.json();
    assert.equal(generation.status, "failed", status.body);
    assert.equal(generation.error.code, "unsupportedSource");
    assert.match(generation.error.message, /doesn’t teach from the Bible/);
    assert.equal(harness.counts.openai, 0);
    assert.equal(await harness.worker.runOnce(), false);
  } finally {
    await harness.close();
  }
});
