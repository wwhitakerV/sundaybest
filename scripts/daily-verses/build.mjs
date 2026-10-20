#!/usr/bin/env node
// Builds Home's verse of the day: each day's caption and reference from
// scripts/daily-verses/daily-verses.json, with its verses' words from the
// Bibles the app bundles (api/data/bible), in each translation it can show.
// Writes src/features/home/data/daily-verses.json, which the app reads; run it
// after any change to the list (`npm run build:verses`). A test fails until it's run.
//
// An entry with two references ("Romans 8:1; 2 Corinthians 5:17") shows its
// first; the script lists those, to be split or fixed in the list.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCE = join(ROOT, "scripts/daily-verses/daily-verses.json");
const OUTPUT = join(ROOT, "src/features/home/data/daily-verses.json");
const BIBLE = join(ROOT, "api/data/bible");
/** The translations the app carries the words of; any other setting shows the BSB. */
const TRANSLATIONS = ["BSB", "KJV"];

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifest = read(join(BIBLE, "manifest.json"));
const bibles = Object.fromEntries(
  TRANSLATIONS.map((code) => [code, read(join(BIBLE, `${code.toLowerCase()}.json`)).books]),
);

/** A book's number, from its name or one of its aliases. */
const bookNumbers = new Map();
for (const book of manifest.books) {
  for (const name of [book.name, book.displayName, ...book.aliases]) {
    bookNumbers.set(name.toLowerCase(), String(book.id));
  }
}

/** "James 5:7-8" → its book, chapter, and first and last verse. */
function parseReference(reference) {
  const match = /^(.+?) (\d+):(\d+)(?:[-–](\d+))?$/.exec(reference.trim());
  if (!match) throw new Error(`Can't read the reference "${reference}"`);
  const [, book, chapter, first, last] = match;
  const number = bookNumbers.get(book.toLowerCase());
  if (!number) throw new Error(`No book called "${book}"`);
  return { book: number, chapter, first: Number(first), last: Number(last ?? first) };
}

/** A passage's verses in one translation, any the translation omits left out. */
function versesOf(code, { book, chapter, first, last }) {
  const verses = [];
  for (let number = first; number <= last; number++) {
    const text = bibles[code][book]?.[chapter]?.[String(number)];
    if (text === undefined) throw new Error(`${code} has no ${book} ${chapter}:${number}`);
    if (text.trim()) verses.push({ number, text: text.trim() });
  }
  return verses;
}

const twoReferences = [];
const days = read(SOURCE).map(({ date, caption, scriptureReference }) => {
  const [reference, ...more] = scriptureReference.split(";").map((part) => part.trim());
  if (more.length > 0) twoReferences.push(`${date}: ${scriptureReference}`);
  const passage = parseReference(reference);
  return {
    date,
    caption,
    reference,
    verses: Object.fromEntries(TRANSLATIONS.map((code) => [code, versesOf(code, passage)])),
  };
});

writeFileSync(OUTPUT, `${JSON.stringify(days, null, 2)}\n`);
console.log(`Wrote ${days.length} days to ${OUTPUT}.`);
if (twoReferences.length > 0) {
  console.log(`These show only their first reference:\n  ${twoReferences.join("\n  ")}`);
}
