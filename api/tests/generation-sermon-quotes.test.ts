import assert from "node:assert/strict";
import test from "node:test";
import { quoteProblem, sermonWords, withoutQuotes } from "../src/generation/sermon-quotes.js";
import { generationInput } from "./fixtures/generation.js";

const words = sermonWords(generationInput(), "Test");

test("a line in its own words quotes nothing", () => {
  assert.equal(quoteProblem("Wait on God through every storm you face, and keep trusting Him.", words), null);
});

test("words put in the pastor's mouth quote the sermon, even made-up ones", () => {
  assert.match(quoteProblem("Test: “When I lost my father I learned to wait.”", words)!, /quotes the sermon/);
  assert.match(quoteProblem("Pastor Test: \"Reflect on that love.\"", words)!, /quotes the sermon/);
  assert.match(quoteProblem("From the sermon: “Reflect on that love.”", words)!, /quotes the sermon/);
});

test("the sermon's words in quotation marks quote it", () => {
  assert.match(quoteProblem("Remember “wait with patience and keep trusting” today.", words)!, /quotes the sermon/);
});

test("Scripture in quotation marks is not a quote of the sermon, though the sermon reads it", () => {
  assert.equal(quoteProblem("Psalm 23 says “the Lord is my shepherd; I shall not want.”", words), null);
});

test("a phrase of its own in quotation marks is not a quote of the sermon", () => {
  assert.equal(quoteProblem("Say “not yet” to your worry.", words), null);
});

test("a long run of the sermon's words copies it, with or without marks", () => {
  assert.match(quoteProblem("Friend, teaching 3 says wait with patience and keep trusting through the storm.", words)!, /word for word/);
});

test("taking the quotes out leaves the words plain, without their attribution", () => {
  const { text, notes } = withoutQuotes("Test: “When I lost my father I learned to wait.” Keep waiting. Remember “wait with patience and keep trusting” today. Say “not yet”.", words);
  assert.equal(text, "When I lost my father I learned to wait. Keep waiting. Remember wait with patience and keep trusting today. Say “not yet”.");
  assert.equal(notes.length, 2);
});
