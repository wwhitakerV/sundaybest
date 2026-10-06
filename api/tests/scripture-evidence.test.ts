import assert from "node:assert/strict";
import test from "node:test";
import { findScriptureEvidence, teachesFromScripture } from "../src/generation/scripture-evidence.js";

test("a verse read aloud is found in the translation it was read from, whatever its punctuation", () => {
  const bsb = findScriptureEvidence("he said for god so loved the world that he gave his one and only son and then he sat down");
  const kjv = findScriptureEvidence("The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures!");
  assert.deepEqual(bsb.quotedVerses, ["John 3:16"]);
  assert.deepEqual(kjv.quotedVerses, ["Psalm 23:1", "Psalm 23:2"]);
});

test("words a verse happens to share with everyday speech are not a quotation", () => {
  assert.deepEqual(findScriptureEvidence("so we went down to the river and built a house out of oak logs and then the world loaded").quotedVerses, []);
});

test("a chapter that does not exist is not counted as named", () => {
  assert.deepEqual(findScriptureEvidence("Turn to John 99, then Romans 8 verse 28.").chapters, ["Romans 8"]);
});

test("a sermon that names its passages and reads from them teaches from Scripture", () => {
  const evidence = findScriptureEvidence("Turn to Romans 8. And we know that God works all things together for the good of those who love Him. "
    + "Then Psalm 23: The Lord is my shepherd; I shall not want. And John 3:16.");
  assert.equal(teachesFromScripture(evidence), true);
});

test("a talk that mentions one verse in passing does not teach from Scripture", () => {
  assert.equal(teachesFromScripture(findScriptureEvidence("Like John 3:16 says, believe in yourself. Ten habits for a better morning.")), false);
});

test("a video with no Scripture at all does not teach from Scripture", () => {
  assert.equal(teachesFromScripture(findScriptureEvidence("Today we are building a spear only base in Minecraft.")), false);
});
