import assert from "node:assert/strict";
import test from "node:test";
import { generateStagedPlan } from "../src/generation/pipeline.js";
import { mapPlanDays } from "../src/generation/stages/plan-days.js";
import { validatePlanStructure } from "../src/generation/validation.js";
import { createBibleProvider } from "../src/providers/bible-provider.js";
import { fakeCaller, generationInput, memoryInventory, outlineOutput, testEnv } from "./fixtures/generation.js";

const bible = createBibleProvider(testEnv());

/** The sermon's points as a three-day plan wrote them. */
async function keptFromThreeDays() {
  const inventory = memoryInventory();
  await generateStagedPlan(generationInput(3), { call: fakeCaller().caller, bible, inventory });
  return inventory;
}

test("a finished plan keeps the sermon's points, speaker and About for its other lengths", async () => {
  const inventory = await keptFromThreeDays();
  assert.equal(inventory.saved?.speakerName, null);
  assert.deepEqual(inventory.saved?.points.map((point) => point.id), ["p1", "p2", "p3"]);
  assert.deepEqual(inventory.saved?.about.keyTakeaways, ["God's love is demonstrated in giving His Son.", "Love calls for a faithful response today."]);
});

test("another length of a sermon whose points are kept only divides them into days", async () => {
  const inventory = await keptFromThreeDays();
  const { caller, requests } = fakeCaller();
  const plan = await generateStagedPlan(generationInput(2), { call: caller, bible, inventory });
  const planStep = requests.find((request) => request.stage === "plan")!;
  assert.equal(planStep.schemaName, "sundaybest_plan_days");
  assert.deepEqual((JSON.parse(planStep.task).points as Array<{ id: string; block: string }>).map((point) => [point.id, point.block]), [["p1", "b3"], ["p2", "b9"], ["p3", "b15"]]);
  assert.deepEqual(plan.formation!.points, inventory.saved!.points);
  assert.deepEqual(plan.days.flatMap((day) => day.journey!.pointIds).sort(), ["p1", "p2", "p3"]);
  assert.doesNotThrow(() => validatePlanStructure(plan, generationInput(2)));
});

test("kept points fewer than the plan's days are written fresh", async () => {
  const inventory = await keptFromThreeDays();
  const { caller, requests } = fakeCaller();
  await generateStagedPlan(generationInput(5), { call: caller, bible, inventory });
  assert.equal(requests.find((request) => request.stage === "plan")!.schemaName, "sundaybest_plan");
});

test("dividing kept points places a point no day lists on the day whose part of the sermon makes it", async () => {
  const inventory = await keptFromThreeDays();
  const outline = mapPlanDays({ days: outlineOutput(2).days }, generationInput(2), inventory.saved!);
  assert.deepEqual(outline.days.map((day) => day.pointIds), [["p1"], ["p2", "p3"]]);
  assert.ok(outline.notes.some((note) => /p3 was on no day/.test(note)));
});

test("dividing kept points never takes a point the sermon doesn't make", async () => {
  const inventory = await keptFromThreeDays();
  const raw = { days: outlineOutput(2).days };
  raw.days[0]!.pointIds = ["p1", "p9"];
  const outline = mapPlanDays(raw, generationInput(2), inventory.saved!);
  assert.deepEqual(outline.days[0]!.pointIds, ["p1"]);
});

test("a day's passage must still be named in the sermon when kept points are divided", async () => {
  const inventory = await keptFromThreeDays();
  const raw = { days: outlineOutput(1).days };
  raw.days[0]!.scripture = { book: "Acts", chapter: 5, verseStart: 1, verseEnd: 11, reference: "Acts 5:1-11" };
  assert.throws(() => mapPlanDays(raw, generationInput(1), inventory.saved!), /Acts 5:1-11 is not named in the transcript/);
});
