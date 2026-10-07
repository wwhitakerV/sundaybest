import assert from "node:assert/strict";
import test from "node:test";

import { readingParagraphForApi, readingParagraphText } from "../src/generation/reading.js";

test("a reading paragraph goes to the app with its heading and content", () => {
  assert.deepEqual(readingParagraphForApi({ heading: "Hope Is Not Denial", content: "Real pain is named." }), {
    heading: "Hope Is Not Denial",
    content: "Real pain is named.",
  });
});

test("a paragraph from a plan written before headings goes as it was, with no heading", () => {
  assert.deepEqual(readingParagraphForApi("Read: When disappointment leaves us spiritually thirsty"), {
    heading: null,
    content: "Read: When disappointment leaves us spiritually thirsty",
  });
});

test("a paragraph's words are its heading then its content; an old one's are its text", () => {
  assert.equal(readingParagraphText({ heading: "Hope", content: "Real pain." }), "Hope Real pain.");
  assert.equal(readingParagraphText("Real pain."), "Real pain.");
});
