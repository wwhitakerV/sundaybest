import assert from "node:assert/strict";
import test from "node:test";
import { namedChapters } from "../src/generation/scripture.js";
import { mapOutline } from "../src/generation/stages/outline.js";
import { generationInput, outlineOutput, sourceQuote } from "./fixtures/generation.js";

test("the plan step keeps the title, About this plan, and each day's passage in canonical form", () => {
  const outline = mapOutline(outlineOutput(2), generationInput(2));
  assert.equal(outline.title, "God’s love");
  assert.deepEqual(outline.about.overview, ["This plan studies how God's love is shown in giving His Son."]);
  assert.deepEqual(outline.days.map((day) => [day.dayNumber, day.title, day.scripture.reference]), [[1, "Love, day 1", "John 3:16"], [2, "Love, day 2", "John 3:17"]]);
});

test("the plan step must return exactly the requested days", () => {
  assert.throws(() => mapOutline(outlineOutput(2), generationInput(3)), /exactly 3 days/);
});

test("a day's passage must be in a chapter the sermon names", () => {
  const raw = outlineOutput();
  raw.days[0]!.scripture = { book: "Acts", chapter: 5, verseStart: 1, verseEnd: 11, reference: "Acts 5:1-11" };
  assert.throws(() => mapOutline(raw, generationInput()), /Acts 5:1-11 is not named in the transcript/);
});

test("a day's passage may continue past the verse where the sermon starts reading", () => {
  const named = "Uh Luke chapter 16, verse 19. I'm going to show you something about the rich man.";
  const input = generationInput();
  input.transcriptSegments = [{ startMs: 0, endMs: 30_000, text: named }];
  input.transcript = named;
  const raw = outlineOutput();
  raw.days[0]!.scripture = { book: "Luke", chapter: 16, verseStart: 19, verseEnd: 31, reference: "Luke 16:19-31" };
  raw.about.scripturesReferenced = [];
  assert.equal(mapOutline(raw, input).days[0]!.scripture.reference, "Luke 16:19-31");
});

test("days may not study overlapping passages", () => {
  const raw = outlineOutput(2);
  raw.days[1]!.scripture = { book: "John", chapter: 3, verseStart: 16, verseEnd: 17, reference: "John 3:16-17" };
  assert.throws(() => mapOutline(raw, generationInput(2)), /Days 1 and 2 study overlapping passages/);
});

test("a passage whose written reference disagrees with its numbers takes the numbers", () => {
  const raw = outlineOutput();
  raw.days[0]!.scripture.reference = "John 3:17";
  assert.equal(mapOutline(raw, generationInput()).days[0]!.scripture.reference, "John 3:16");
});

test("Scriptures referenced are canonical and deduplicated", () => {
  const raw = outlineOutput();
  raw.about.scripturesReferenced.push({ ...raw.about.scripturesReferenced[0]!, book: "john", reference: "john 3:16" });
  assert.deepEqual(mapOutline(raw, generationInput()).about.scripturesReferenced, [{ book: "John", chapter: 3, verseStart: 16, verseEnd: 16, reference: "John 3:16" }]);
});

test("a Scripture named only by chapter is listed as the chapter", () => {
  const raw = outlineOutput();
  raw.about.scripturesReferenced = [{ book: "John", chapter: 3, verseStart: null, verseEnd: null, reference: "John 3", evidenceQuote: sourceQuote }];
  assert.deepEqual(mapOutline(raw, generationInput()).about.scripturesReferenced, [{ book: "John", chapter: 3, verseStart: null, verseEnd: null, reference: "John 3" }]);
});

test("a day's passage missing from Scriptures referenced is added as its chapter", () => {
  const raw = outlineOutput();
  raw.about.scripturesReferenced = [];
  assert.deepEqual(mapOutline(raw, generationInput()).about.scripturesReferenced, [{ book: "John", chapter: 3, verseStart: null, verseEnd: null, reference: "John 3" }]);
});

test("Scriptures referenced that the transcript never names, or whose fields disagree, are left out", () => {
  const raw = outlineOutput();
  raw.about.scripturesReferenced.push(
    { book: "Romans", chapter: 8, verseStart: 28, verseEnd: 28, reference: "Romans 8:28", evidenceQuote: sourceQuote },
    { ...raw.about.scripturesReferenced[0]!, verseStart: 17, verseEnd: 17 },
  );
  assert.deepEqual(mapOutline(raw, generationInput()).about.scripturesReferenced.map((citation) => citation.reference), ["John 3:16"]);
});

test("malformed plan step output is rejected", () => {
  assert.throws(() => mapOutline({ title: "Missing days" }, generationInput()), /plan step returned invalid content/);
});

test("the chapters a sermon names are listed once each, in the order it names them, however they are spoken", () => {
  const source = "Turn with me to first Corinthians thirteen. Later, Psalm 23 verse 1, then 1 Corinthians 13:4 again, and John chapter three.";
  assert.deepEqual(namedChapters(source), ["1 Corinthians 13", "Psalm 23", "John 3"]);
});
