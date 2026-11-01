import assert from "node:assert/strict";
import test from "node:test";
import { FACULTIES } from "../src/generation/journey.js";
import { mapOutline } from "../src/generation/stages/outline.js";
import { mapFormation } from "../src/generation/stages/formation.js";
import { blockOf, formationOutput, generationInput, outlineOutput } from "./fixtures/generation.js";

function setup(lengthDays = 1) {
  const input = generationInput(lengthDays);
  const outline = mapOutline(outlineOutput(lengthDays), input);
  const map = (raw: unknown, dayNumber = 1, last = false) => mapFormation(raw, input, outline, outline.days[dayNumber - 1]!, { last });
  return { map, raw: formationOutput(1) };
}

test("a day's six faculties come in their order, each a question answered from the sermon's teaching", () => {
  const { map, raw } = setup();
  const day = map(raw);
  assert.deepEqual(day.faculties.map((entry) => entry.faculty), [...FACULTIES]);
  assert.equal(day.faculties[0]!.pointId, "p1");
  assert.equal(day.faculties[0]!.answer, raw.faculties[0]!.answer);
  assert.deepEqual(day.notes, []);
});

test("faculties out of their order are put in order", () => {
  const { map, raw } = setup();
  raw.faculties.reverse();
  assert.deepEqual(map(raw).faculties.map((entry) => entry.faculty), [...FACULTIES]);
});

test("a day missing one of the six is written again", () => {
  const { map, raw } = setup();
  raw.faculties[1]!.faculty = "see";
  assert.throws(() => map(raw), /Day 1 needs each of see, hear, understand, do, speak, examine once/);
});

test("an answer naming a point that isn't the day's counts as the day's", () => {
  const { map, raw } = setup();
  raw.faculties[0]!.pointId = "p9";
  assert.equal(map(raw).faculties[0]!.pointId, "p1");
});

test("a point no faculty answers is listed at the day's end, as its own statement", () => {
  const raw = outlineOutput(1);
  raw.points.push({ id: "p9", kind: "warning", statement: "Do not rush what God is doing.", evidenceBlocks: [blockOf(40)] });
  raw.days[0]!.pointIds.push("p9");
  const input = generationInput(1);
  const outline = mapOutline(raw, input);
  const day = mapFormation(formationOutput(1), input, outline, outline.days[0]!);
  assert.deepEqual(day.ending, [{ pointId: "p9", statement: "Do not rush what God is doing." }]);
});

test("an answer may name the sermon's own passages", () => {
  const { map, raw } = setup();
  raw.faculties[2]!.answer = "John 3 shows how far God's love goes: He gave His Son.";
  assert.equal(map(raw).faculties[2]!.answer, "John 3 shows how far God's love goes: He gave His Son.");
});

test("an answer naming Scripture the sermon never names is written again, and kept, noted, on the last attempt", () => {
  const { map, raw } = setup();
  raw.faculties[2]!.answer = "Romans 8 says nothing can separate you from God's love.";
  assert.throws(() => map(raw), /Day 1's understand answer names Scripture the sermon doesn't name/);
  assert.match(map(raw, 1, true).notes.join(" "), /understand answer names Scripture/);
});

test("an answer that quotes the sermon is written again, and kept as plain words on the last attempt", () => {
  const { map, raw } = setup();
  raw.faculties[1]!.answer = "Pastor Test: “When I lost my father I learned to wait on God.” Keep waiting.";
  assert.throws(() => map(raw), /Day 1's hear answer quotes the sermon/);
  const day = map(raw, 1, true);
  assert.equal(day.faculties[1]!.answer, "When I lost my father I learned to wait on God. Keep waiting.");
  assert.match(day.notes.join(" "), /hear answer quotes the sermon/);
});

test("a commitment may put a phrase of its own in quotation marks", () => {
  const { map, raw } = setup();
  raw.faculties[3]!.commitment = "Say “not yet” to your worry.";
  assert.equal(map(raw).faculties[3]!.commitment, "Say “not yet” to your worry.");
});

test("faculties in the wrong shape are written again", () => {
  const { map } = setup();
  assert.throws(() => map({ faculties: [] }), /came back in the wrong shape/);
});
