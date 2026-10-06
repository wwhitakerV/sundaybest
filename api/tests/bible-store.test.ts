import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createBibleStore } from "../src/bible/bible-store.js";
import type { BibleTranslation } from "../src/bible/types.js";

const store = createBibleStore();
const read = (reference: string, translation: BibleTranslation) =>
  store.getPassage({ ...store.parseReference(reference, translation), translation });

test("bundles exactly the public-domain BSB and KJV", () => {
  assert.deepEqual(store.availableTranslations, ["BSB", "KJV"]);
});

test("every packaged verse resolves with unchanged text", () => {
  for (const translation of store.availableTranslations) {
    const asset = JSON.parse(readFileSync(new URL(`../data/bible/${translation.toLowerCase()}.json`, import.meta.url), "utf8")) as {
      books: Record<string, Record<string, Record<string, string>>>;
    };
    for (const [bookId, chapters] of Object.entries(asset.books)) {
      for (const [chapter, verses] of Object.entries(chapters)) {
        for (const [number, text] of Object.entries(verses)) {
          const result = store.getPassage({
            bookId: Number(bookId), chapter: Number(chapter), verseStart: Number(number),
            verseEnd: Number(number), referenceTranslation: translation, translation,
          });
          if (text === "") {
            assert.equal(result.passageStatus, "unavailable");
            assert.deepEqual(result.missingVerses, [{ number: Number(number), reason: "omitted_in_translation" }]);
          } else {
            assert.equal(result.passageStatus, "complete");
            assert.deepEqual(result.verses, [{ number: Number(number), text }]);
          }
        }
      }
    }
  }
});

test("verses the BSB omits keep their numbering and carry a note", () => {
  const result = read("Matthew 17:20-22", "BSB");
  assert.equal(result.passageStatus, "partial");
  assert.deepEqual(result.verses.map((verse) => verse.number), [20, 22]);
  assert.deepEqual(result.missingVerses.map((verse) => verse.number), [21]);
  assert.equal(result.notes[0]!.kind, "omission");
  assert.equal(read("Matthew 17:21", "KJV").passageStatus, "complete");
});

test("canonical book names and aliases resolve to stable IDs", () => {
  assert.equal(store.parseReference("Psalm 23:1-2", "BSB").bookId, 19);
  assert.equal(store.parseReference("Psalms 23:1", "BSB").bookId, 19);
  assert.equal(store.parseReference("Song of Solomon 1:1", "BSB").bookId, 22);
  assert.equal(store.parseReference("Song of Songs 1:1", "BSB").bookId, 22);
});

test("invalid references fail explicitly", () => {
  for (const reference of ["Genesis 0:1", "Genesis 1:0", "Genesis 1:32", "Genesis 51:1", "John 3:17-16", "Fake 1:1", "John 3", "3 John 1:15"]) {
    assert.throws(() => store.parseReference(reference, "BSB"), { code: "INVALID_REFERENCE" });
  }
});

test("translations that are not bundled fail explicitly", () => {
  for (const translation of ["NIV", "ESV"]) {
    assert.throws(() => store.parseReference("John 3:16", translation as BibleTranslation), { code: "UNSUPPORTED_TRANSLATION" });
  }
});

test("returned passages cannot change later lookups", () => {
  const first = read("John 3:16", "BSB");
  const original = first.verses[0]!.text;
  first.verses[0]!.text = "changed";
  assert.equal(read("John 3:16", "BSB").verses[0]!.text, original);
});
