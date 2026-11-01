import assert from "node:assert/strict";
import test from "node:test";
import { apiHarness } from "./fixtures/api-harness.js";

type Harness = Awaited<ReturnType<typeof apiHarness>>;

async function builtPlan(harness: Harness, lengthDays = 2) {
  const reader = await harness.user("review-reader");
  const sermonId = await harness.resolveSermon(reader);
  const created = await reader.mutate("POST", "/v1/plans", { sermonId, lengthDays, quickCheckEnabled: false });
  assert.equal(created.statusCode, 200, created.body);
  await harness.worker.runOnce();
  return created.json().planId as string;
}

test("the review lists recent plans, newest first", async () => {
  const harness = await apiHarness();
  try {
    const planId = await builtPlan(harness);
    const listed = await harness.app.inject({ method: "GET", url: "/dev/admin/plans" });
    assert.equal(listed.statusCode, 200, listed.body);
    assert.deepEqual(listed.json().plans.map((plan: { id: string; state: string }) => [plan.id, plan.state]), [[planId, "ready"]]);
    assert.match(listed.json().plans[0].url, /^https:\/\/www\.youtube\.com\/watch\?v=5fVA7C24eI4$/);
  } finally {
    await harness.close();
  }
});

test("a plan's review shows every day's Read, Scripture, points, and faculties", async () => {
  const harness = await apiHarness();
  try {
    const planId = await builtPlan(harness);
    const review = await harness.app.inject({ method: "GET", url: `/dev/admin/plans/${planId}/review` });
    assert.equal(review.statusCode, 200, review.body);
    const { plan, days } = review.json();
    assert.deepEqual(plan.points.map((point: { id: string }) => point.id), ["p1", "p2"]);
    assert.equal(days.length, 2);
    const [first] = days;
    assert.equal(first.passage, "John 3:16");
    assert.deepEqual(first.alsoReferenced, ["Psalm 23", "Ephesians 2"]);
    assert.deepEqual(first.points.map((point: { id: string }) => point.id), ["p1"]);
    assert.deepEqual(first.readingParagraphs[0].pointIds, ["p1"]);
    assert.equal(first.prayer.title, "Prayer");
    assert.deepEqual(first.faculties.map((entry: { faculty: string }) => entry.faculty), ["see", "hear", "understand", "do", "speak", "examine"]);
    assert.equal(first.faculties[0].answer, "Wait with patience and keep trusting through the storm, as see learns on day 1.");
  } finally {
    await harness.close();
  }
});

test("a plan's review shows where in the video each point and each day's part is, never the sermon quoted", async () => {
  const harness = await apiHarness();
  try {
    const planId = await builtPlan(harness);
    const { plan, days } = (await harness.app.inject({ method: "GET", url: `/dev/admin/plans/${planId}/review` })).json();
    assert.match(plan.url, /youtube\.com\/watch\?v=5fVA7C24eI4/);
    assert.deepEqual(plan.points.map((point: { startSeconds: number }) => point.startSeconds), [60, 138]);
    assert.deepEqual(days[0].clip, { startSeconds: 60, endSeconds: 138 });
    assert.equal("sermonQuote" in days[0], false);
  } finally {
    await harness.close();
  }
});

test("a plan's review shows what its generation repaired", async () => {
  const harness = await apiHarness();
  try {
    const planId = await builtPlan(harness, 1);
    const clean = await harness.app.inject({ method: "GET", url: `/dev/admin/plans/${planId}/review` });
    assert.deepEqual(clean.json().notes, []);
    await harness.pg.query(`update plan_generations set notes = '["Ephesians 2 was on no day; it was added to day 1."]'::jsonb`);
    const noted = await harness.app.inject({ method: "GET", url: `/dev/admin/plans/${planId}/review` });
    assert.deepEqual(noted.json().notes, ["Ephesians 2 was on no day; it was added to day 1."]);
  } finally {
    await harness.close();
  }
});

test("a plan written before the faculties shows its Read with none", async () => {
  const harness = await apiHarness();
  try {
    const planId = await builtPlan(harness, 1);
    await harness.pg.query("update plan_days set journey = null");
    await harness.pg.query("update plans set formation = null");
    const review = await harness.app.inject({ method: "GET", url: `/dev/admin/plans/${planId}/review` });
    assert.equal(review.statusCode, 200, review.body);
    assert.deepEqual(review.json().days[0].faculties, []);
    assert.deepEqual(review.json().plan.points, []);
  } finally {
    await harness.close();
  }
});

test("the review answers only the machine itself", async () => {
  const harness = await apiHarness();
  try {
    for (const url of ["/dev/admin/plans", "/dev/admin/review"]) {
      const away = await harness.app.inject({ method: "GET", url, remoteAddress: "10.0.0.7" });
      assert.equal(away.statusCode, 404, url);
    }
    const page = await harness.app.inject({ method: "GET", url: "/dev/admin/review" });
    assert.equal(page.statusCode, 200);
    assert.match(page.headers["content-type"] as string, /text\/html/);
  } finally {
    await harness.close();
  }
});
