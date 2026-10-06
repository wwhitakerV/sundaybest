import assert from "node:assert/strict";
import test from "node:test";
import { mapDay } from "../src/generation/stages/day.js";
import { mapOutline } from "../src/generation/stages/outline.js";
import { dayOutput, generationInput, outlineOutput, sourceQuote } from "./fixtures/generation.js";

const input = generationInput();
const outline = mapOutline(outlineOutput(), input);
const day = outline.days[0]!;
const map = (raw: unknown, sermonInput = input) => mapDay(raw, sermonInput, day, outline);

test("the day step keeps the reading, reflections, prayer, quote and clip", () => {
  const mapped = map(dayOutput());
  assert.deepEqual(mapped.readingParagraphs, ["God's love is demonstrated in giving His Son. Study emphasis 1."]);
  assert.equal(mapped.sermonQuote, sourceQuote);
  assert.deepEqual([mapped.clipStartSeconds, mapped.clipEndSeconds], [0, 30]);
  assert.equal(mapped.reflections.length, 1);
  assert.equal(mapped.prayer.title, "Prayer");
});

test("a sermon quote that is not in the transcript is left out", () => {
  assert.equal(map({ ...dayOutput(), sermonQuote: "Invented words" }).sermonQuote, null);
});

test("a clip on a transcript without timing is left out", () => {
  const untimed = generationInput();
  untimed.transcriptSegments = [{ startMs: 0, endMs: null, text: sourceQuote }];
  const mapped = map(dayOutput(), untimed);
  assert.deepEqual([mapped.clipStartSeconds, mapped.clipEndSeconds], [null, null]);
});

test("a clip past the end of the transcript is left out", () => {
  assert.equal(map({ ...dayOutput(), clipEndSeconds: 100 }).clipStartSeconds, null);
});

test("a clip that does not contain its sermon quote is left out", () => {
  assert.equal(map({ ...dayOutput(), clipStartSeconds: 30, clipEndSeconds: 60 }).clipStartSeconds, null);
});

test("the reading may have up to twenty paragraphs", () => {
  const paragraphs = Array.from({ length: 20 }, (_, index) => `Paragraph ${index + 1} of the reading.`);
  assert.equal(map({ ...dayOutput(), readingParagraphs: paragraphs }).readingParagraphs.length, 20);
  assert.throws(() => map({ ...dayOutput(), readingParagraphs: [...paragraphs, "One too many."] }), /day step returned invalid content/);
});

const romans5 = { book: "Romans", chapter: 5, verseStart: 8, verseEnd: 8, reference: "Romans 5:8", connection: "  Shows God's love given before we responded.  " };

test("supporting Scripture is kept with its connection", () => {
  assert.deepEqual(map({ ...dayOutput(), supportingScriptures: [romans5] }).supportingScriptures,
    [{ ...romans5, connection: "Shows God's love given before we responded." }]);
});

test("supporting Scripture that overlaps Scripture the sermon names is left out", () => {
  const john = { ...romans5, book: "John", chapter: 3, verseStart: 16, verseEnd: 16, reference: "John 3:16" };
  assert.deepEqual(map({ ...dayOutput(), supportingScriptures: [john] }).supportingScriptures, []);
});

test("supporting Scripture appears once and runs ten verses or fewer", () => {
  const long = { ...romans5, verseStart: 1, verseEnd: 11, reference: "Romans 5:1-11" };
  const mapped = map({ ...dayOutput(), supportingScriptures: [romans5, { ...romans5, book: "romans", reference: "romans 5:8" }, long] });
  assert.deepEqual(mapped.supportingScriptures.map((passage) => passage.reference), ["Romans 5:8"]);
});
