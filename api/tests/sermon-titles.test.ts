import assert from "node:assert/strict";
import test from "node:test";
import { apiHarness } from "./fixtures/api-harness.js";

type Harness = Awaited<ReturnType<typeof apiHarness>>;
type Reader = Awaited<ReturnType<Harness["user"]>>;

const VIDEO = "GOD'S LOVE | Unshakable (Part 2) | Pastor Test | Test Church";

async function build(harness: Harness, reader: Reader, lengthDays = 1) {
  const sermonId = await harness.resolveSermon(reader);
  const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays, quickCheckEnabled: false });
  assert.equal(created.statusCode, 200, created.body);
  await harness.worker.runOnce();
  const detail = await reader.get(`/v1/plans/${created.json().planId}`);
  assert.equal(detail.statusCode, 200, detail.body);
  return detail.json().plan as { title: string; sermon: { title: string; series: string | null; part: string | null } };
}

test("a plan's title is its sermon's own title, with its series and part beside it", async () => {
  const harness = await apiHarness();
  try {
    harness.flags.videoTitle = VIDEO;
    harness.flags.titleAnswer = { title: "God's love", series: "Unshakable", part: "Part 2" };
    const plan = await build(harness, await harness.user("titled-reader"));
    assert.equal(plan.title, "God's Love");
    assert.deepEqual(plan.sermon, { ...plan.sermon, title: "God's Love", series: "Unshakable", part: "Part 2" });
  } finally {
    await harness.close();
  }
});

test("a sermon's title is found once, for all its plans, reused ones included", async () => {
  const harness = await apiHarness();
  try {
    harness.flags.videoTitle = VIDEO;
    harness.flags.titleAnswer = { title: "God's love", series: null, part: null };
    await build(harness, await harness.user("first-titled"));
    const copied = await build(harness, await harness.user("second-titled"));
    const longer = await build(harness, await harness.user("third-titled"), 2);
    assert.equal(harness.counts.titles, 1);
    assert.equal(copied.title, "God's Love");
    assert.equal(longer.title, "God's Love");
  } finally {
    await harness.close();
  }
});

test("a title step that fails twice leaves the video's own title, and the plan still arrives", async () => {
  const harness = await apiHarness();
  try {
    harness.flags.videoTitle = VIDEO;
    harness.flags.titleAnswer = { title: "Something invented", series: null, part: null };
    const plan = await build(harness, await harness.user("untitled-reader"));
    assert.equal(plan.title, VIDEO);
    assert.equal(harness.counts.titles, 2);
    await build(harness, await harness.user("untitled-again"), 2);
    assert.equal(harness.counts.titles, 4);
  } finally {
    await harness.close();
  }
});

test("a sermon whose video is retitled on YouTube has its title found again", async () => {
  const harness = await apiHarness();
  try {
    const reader = await harness.user("retitled-reader");
    harness.flags.videoTitle = VIDEO;
    await build(harness, reader);
    await harness.pg.query("update sermon_sources set metadata_fetched_at = now() - interval '8 days'");
    harness.flags.videoTitle = "God's Love Never Fails | Test Church";
    await harness.resolveSermon(reader);
    const [sermon] = (await harness.pg.query<{ display_title: string | null; titled_version: string | null }>("select display_title, titled_version from sermon_sources")).rows;
    assert.deepEqual(sermon, { display_title: null, titled_version: null });
  } finally {
    await harness.close();
  }
});
