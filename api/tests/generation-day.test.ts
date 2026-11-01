import assert from "node:assert/strict";
import test from "node:test";
import { mapDay } from "../src/generation/stages/day.js";
import { mapOutline } from "../src/generation/stages/outline.js";
import { dayOutput, generationInput, outlineOutput } from "./fixtures/generation.js";

const input = generationInput();
const outline = mapOutline(outlineOutput(), input);
const day = outline.days[0]!;
const map = (raw: unknown, sermonInput = input) => mapDay(raw, sermonInput, day, outline);

test("the day step keeps the reading, reflections and prayer, and writes no quote or clip", () => {
  const mapped = map(dayOutput());
  assert.deepEqual(mapped.readingParagraphs, [
    { heading: "Love That Gives", content: "God's love is demonstrated in giving His Son. Study emphasis 1." },
  ]);
  assert.equal(mapped.reflections.length, 1);
  assert.equal(mapped.prayer.title, "Prayer");
  assert.equal("sermonQuote" in mapped, false);
  assert.equal("clipStartSeconds" in mapped, false);
});

test("the reading may have up to twenty paragraphs", () => {
  const paragraphs = Array.from({ length: 20 }, (_, index) => ({ heading: `Idea ${index + 1}`, content: `Paragraph ${index + 1} of the reading.`, pointIds: ["p1"] }));
  assert.equal(map({ ...dayOutput(), readingParagraphs: paragraphs }).readingParagraphs.length, 20);
  assert.throws(() => map({ ...dayOutput(), readingParagraphs: [...paragraphs, { heading: "Extra", content: "One too many.", pointIds: [] }] }), /day step returned invalid content/);
});

test("each reading paragraph keeps its heading and content, trimmed", () => {
  const mapped = map({ ...dayOutput(), readingParagraphs: [{ heading: "  Hope Is Not Denial ", content: " Real pain is named. ", pointIds: ["p1"] }] });
  assert.deepEqual(mapped.readingParagraphs, [{ heading: "Hope Is Not Denial", content: "Real pain is named." }]);
});

test("a reading paragraph without its heading is rejected", () => {
  assert.throws(() => map({ ...dayOutput(), readingParagraphs: ["Just text."] }), /day step returned invalid content/);
  assert.throws(() => map({ ...dayOutput(), readingParagraphs: [{ heading: "", content: "Text." }] }), /day step returned invalid content/);
});

test("a heading over eighty characters is rejected", () => {
  assert.throws(() => map({ ...dayOutput(), readingParagraphs: [{ heading: "H".repeat(81), content: "Text." }] }), /day step returned invalid content/);
});

test("the day step adds no Scripture of its own", () => {
  const romans5 = { book: "Romans", chapter: 5, verseStart: 8, verseEnd: 8, reference: "Romans 5:8", connection: "God's love came first." };
  assert.equal("supportingScriptures" in map({ ...dayOutput(), supportingScriptures: [romans5] }), false);
});

test("the Read keeps which of the day's points each section covers", () => {
  assert.deepEqual(map(dayOutput()).readingPointIds, [["p1"]]);
});

test("a Read that leaves out one of its day's points is rejected", () => {
  const raw = outlineOutput(1);
  raw.points.push({ id: "p2", kind: "warning", statement: "Do not rush.", evidenceBlocks: ["b3"] });
  raw.days[0]!.pointIds.push("p2");
  const withTwo = mapOutline(raw, input);
  assert.throws(() => mapDay(dayOutput(), input, withTwo.days[0]!, withTwo), /Day 1's Read leaves out p2/);
  assert.match(mapDay(dayOutput(), input, withTwo.days[0]!, withTwo, { last: true }).notes.join(" "), /Day 1's Read leaves out p2/);
});

test("a Read section claiming a point that isn't the sermon's keeps only the sermon's", () => {
  const raw = dayOutput();
  raw.readingParagraphs[0]!.pointIds = ["p1", "p7"];
  assert.deepEqual(map(raw).readingPointIds, [["p1"]]);
});

test("a Read that quotes the sermon is written again", () => {
  const raw = outlineOutput(1);
  raw.speakerName = "Test";
  const named = mapOutline(raw, input);
  const output = dayOutput();
  output.readingParagraphs[0]!.content = "Wait for it. Test: \u201CWhen I lost my father I learned to wait on God.\u201D That is the call.";
  assert.throws(() => mapDay(output, input, named.days[0]!, named), /Day 1's Read quotes the sermon/);
});

test("on the last attempt a quote of the sermon is kept as plain words, noted", () => {
  const output = dayOutput();
  output.prayer.text = "From the sermon: \"Reflect on that love and respond faithfully today.\" Lord, help me wait.";
  const mapped = mapDay(output, input, day, outline, { last: true });
  assert.equal(mapped.prayer.text, "Reflect on that love and respond faithfully today. Lord, help me wait.");
  assert.match(mapped.notes.join(" "), /prayer quotes the sermon/);
});
