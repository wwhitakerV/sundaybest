import assert from "node:assert/strict";
import test from "node:test";
import { createBibleStore } from "../src/bible/bible-store.js";
import { mapOutline } from "../src/generation/stages/outline.js";
import { mapQuiz, type PassageText } from "../src/generation/stages/quiz.js";
import { QUICK_CHECK_QUESTIONS, finishTheVerseQuestion, generationInput, outlineOutput, quizOutput, sermonQuestion } from "./fixtures/generation.js";

const input = generationInput(1, true);
const day = mapOutline(outlineOutput(), input).days[0]!;
const store = createBibleStore();
const read = (translation: "BSB" | "KJV") => store.getPassage({ ...store.parseReference("John 3:16", translation), translation }).verses;
const passageText: PassageText = { BSB: read("BSB"), KJV: read("KJV") };
const map = (raw: unknown) => mapQuiz(raw, { input, day, passageText });
const withQuestions = (...questions: ReturnType<typeof sermonQuestion>[]) => ({ ...quizOutput(), questions: [...quizOutput().questions, ...questions] });

test("sermon questions keep their choices, labelled A to D, without their evidence", () => {
  const question = map(quizOutput()).questions[0]!;
  assert.deepEqual(question.choices.map((choice) => choice.label), ["A", "B", "C", "D"]);
  assert.equal(question.scriptureReference, null);
  assert.equal("evidenceQuote" in question, false);
});

test("a sermon question whose evidence differs from the captions only in punctuation is kept", () => {
  const question = { ...sermonQuestion(1, 8), evidenceQuote: "Turn to John, chapter three verse sixteen. God loved the world and gave His Son!" };
  assert.equal(map(withQuestions(question)).questions.length, QUICK_CHECK_QUESTIONS + 1);
});

test("a sermon question whose evidence is not in the transcript is left out", () => {
  const question = { ...sermonQuestion(1, 8), evidenceQuote: "Invented evidence" };
  assert.equal(map(withQuestions(question)).questions.length, QUICK_CHECK_QUESTIONS);
});

test("a Scripture question is about the day's passage", () => {
  const question = { ...sermonQuestion(1, 8), source: "scripture" as const, evidenceQuote: null };
  assert.equal(map(withQuestions(question)).questions.at(-1)!.scriptureReference, "John 3:16");
});

test("questions without an explanation, with repeated choices, or repeating a prompt are left out", () => {
  const noExplanation = { ...sermonQuestion(1, 8), explanation: "  " };
  const repeatedChoices = { ...sermonQuestion(1, 9), choices: sermonQuestion(1, 9).choices!.map((choice, index) => ({ ...choice, text: index === 3 ? "Seeking praise" : choice.text })) };
  const repeatedPrompt = sermonQuestion(1, 1);
  assert.equal(map(withQuestions(noExplanation, repeatedChoices, repeatedPrompt)).questions.length, QUICK_CHECK_QUESTIONS);
});

test("a quiz with fewer than seven usable questions returns the ones it has", () => {
  const unusable = { ...sermonQuestion(1, 8), evidenceQuote: "Invented evidence" };
  assert.equal(map({ ...quizOutput(), questions: [...quizOutput().questions.slice(1), unusable] }).questions.length, QUICK_CHECK_QUESTIONS - 1);
});

test("new questions follow the ones already kept, never repeat them, and stop at ten", () => {
  const kept = map(quizOutput()).questions.slice(0, 4);
  const more = { ...quizOutput(), questions: [sermonQuestion(1, 1), ...Array.from({ length: 8 }, (_, index) => sermonQuestion(1, index + 20))] };
  const merged = mapQuiz(more, { input, day, passageText }, kept).questions;
  assert.equal(merged.length, 10);
  assert.deepEqual(merged.slice(0, 4), kept);
  assert.equal(new Set(merged.map((question) => question.prompt)).size, 10);
});

test("finish the verse is built from each translation's own wording, with the answer in the same place", () => {
  const question = map(withQuestions(finishTheVerseQuestion())).questions.at(-1)!;
  assert.equal(question.kind, "finishTheVerse");
  assert.equal(question.scriptureReference, "John 3:16");
  assert.equal(question.variants!.BSB.prompt, "Finish the verse: “For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have ___.”");
  assert.equal(question.variants!.KJV.prompt, "Finish the verse: “For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have ___.”");
  const correct = question.choices.findIndex((choice) => choice.correct);
  assert.equal(question.variants!.BSB.choices[correct], "eternal life");
  assert.equal(question.variants!.KJV.choices[correct], "everlasting life");
  assert.equal(question.prompt, question.variants!.BSB.prompt);
  assert.deepEqual(question.choices.map((choice) => choice.text), question.variants!.BSB.choices);
});

test("finish the verse whose answer is not in the verse is left out", () => {
  const invented = finishTheVerseQuestion();
  invented.verse!.KJV.answer = "eternal life";
  assert.equal(map(withQuestions(invented)).questions.length, QUICK_CHECK_QUESTIONS);
});

test("finish the verse outside the day's passage is left out", () => {
  const elsewhere = finishTheVerseQuestion();
  elsewhere.verse!.number = 17;
  assert.equal(map(withQuestions(elsewhere)).questions.length, QUICK_CHECK_QUESTIONS);
});

test("finish the verse whose wrong answers repeat the right one is left out", () => {
  const repeated = finishTheVerseQuestion();
  repeated.verse!.BSB.distractors = ["eternal life", "great reward", "earthly peace"];
  assert.equal(map(withQuestions(repeated)).questions.length, QUICK_CHECK_QUESTIONS);
});
