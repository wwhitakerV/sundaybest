import assert from "node:assert/strict";
import test from "node:test";
import { blockNumbers, sermonBlocks } from "../src/generation/blocks.js";
import { framingProblem } from "../src/generation/framing.js";

const captions = [
  { startMs: 0, endMs: 4_000, text: "so um the storm isn't telling you" },
  { startMs: 4_000, endMs: 8_000, text: "that God left you know that's that's" },
  { startMs: 13_000, endMs: 17_000, text: "the lie you rehearse in the dark" },
  { startMs: 17_000, endMs: 21_000, text: "and uh you keep rehearsing it" },
];

test("the sermon is split into short numbered blocks", () => {
  assert.deepEqual(sermonBlocks(captions).map((block) => block.text), [
    "so um the storm isn't telling you that God left you know that's that's",
    "the lie you rehearse in the dark and uh you keep rehearsing it",
  ]);
});

test("block numbers are read however the model writes them, never from a time", () => {
  assert.deepEqual(["b45", "B45", "45", "[b45 00:05:31]", "b45-b47", "b45–46", "00:05:31"].map(blockNumbers),
    [[45], [45], [45], [45], [45, 46, 47], [45, 46], []]);
});

test("framing may name the sermon's own passages, and no others", () => {
  assert.equal(framingProblem("Sit with that before you choose.", []), null);
  assert.equal(framingProblem("What does Romans 8 tell you about waiting?", ["Romans 8"]), null);
  assert.match(framingProblem("Think of Romans 8 as you wait.", ["John 3"]) ?? "", /names Scripture the sermon doesn't name/);
});
