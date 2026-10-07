import assert from "node:assert/strict";
import test from "node:test";
import { promptVersionFor, selectInstructions, type CustomPrompts } from "../src/generation/prompts/custom.js";

const STANDARD = "the standard day prompt";
const FIXED = { before: ["# THIS STEP: ONE DAY"], after: ["# OUTPUT FIELDS"] };
const off: CustomPrompts = { enabled: false, version: "custom-1", theory: { outline: null, day: "my day theory", quiz: null } };
const on: CustomPrompts = { ...off, enabled: true };

test("the standard prompt is used while custom prompts are off", () => {
  assert.equal(selectInstructions("day", STANDARD, off, FIXED), STANDARD);
});

test("a custom prompt is your theory between the step's fixed description and its output contract", () => {
  assert.equal(
    selectInstructions("day", STANDARD, on, FIXED),
    "# THIS STEP: ONE DAY\n\n---\n\nmy day theory\n\n---\n\n# OUTPUT FIELDS",
  );
});

test("a step with no theory of yours keeps its standard prompt, even when they're on", () => {
  assert.equal(selectInstructions("quiz", "the standard quiz prompt", on, FIXED), "the standard quiz prompt");
});

test("every step's real fixed parts — what it is and the JSON it must return — are prefilled", () => {
  for (const step of ["outline", "day", "quiz"] as const) {
    const custom: CustomPrompts = { ...on, theory: { outline: "T", day: "T", quiz: "T" } };
    const prompt = selectInstructions(step, "standard", custom);
    assert.match(prompt, /^# THIS STEP:/);
    assert.match(prompt, /# OUTPUT FIELDS[\s\S]*Return only JSON matching the supplied response schema/);
    assert.match(prompt, /\n\nT\n\n/);
  }
  const quiz = selectInstructions("quiz", "standard", { ...on, theory: { outline: null, day: null, quiz: "T" } });
  assert.match(quiz, /# FINISH THE VERSE/);
});

test("plans written with custom prompts record their own prompt version", () => {
  assert.equal(promptVersionFor("sundaybest-staged-2", off), "sundaybest-staged-2");
  assert.equal(promptVersionFor("sundaybest-staged-2", on), "sundaybest-staged-2+custom-1");
});
