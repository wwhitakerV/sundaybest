import assert from "node:assert/strict";
import test from "node:test";
import type { StageCaller, StageRequest } from "../src/generation/pipeline.js";
import { findSermonTitle } from "../src/generation/title/find-title.js";
import { mapTitle } from "../src/generation/title/map-title.js";
import { titleCase } from "../src/generation/title/title-case.js";

test("Title Case capitalises each word but the small ones inside", () => {
  assert.equal(titleCase("what are you waiting for"), "What Are You Waiting For");
  assert.equal(titleCase("the fruit of the spirit and the flesh"), "The Fruit of the Spirit and the Flesh");
});

test("Title Case handles apostrophes, hyphens, numerals and book numbers", () => {
  assert.equal(titleCase("god's grace is enough"), "God's Grace Is Enough");
  assert.equal(titleCase("the fruit of self-control"), "The Fruit of Self-Control");
  assert.equal(titleCase("part ii"), "Part II");
  assert.equal(titleCase("walking through 1 corinthians 13"), "Walking Through 1 Corinthians 13");
});

test("Title Case re-cases shouted words but keeps acronyms", () => {
  assert.equal(titleCase("FAITH OVER FEAR"), "Faith Over Fear");
  assert.equal(titleCase("BREAK FREE From the Grip of Temptation"), "Break Free From the Grip of Temptation");
  assert.equal(titleCase("My Promise To YOU"), "My Promise to You");
  assert.equal(titleCase("why the NIV and KJV differ"), "Why the NIV and KJV Differ");
});

const VIDEO = "“FAITH OVER FEAR” | Unshakable (Part 2) | Pastor Mike Smith | VOUS Church";

test("a title is the video title's own words, in order, put in Title Case", () => {
  assert.deepEqual(mapTitle({ title: "faith over fear", series: "Unshakable", part: "Part 2" }, VIDEO),
    { title: "Faith Over Fear", series: "Unshakable", part: "Part 2" });
});

test("a title with a word the video title doesn't have is rejected", () => {
  assert.throws(() => mapTitle({ title: "Faith Beats Fear", series: null, part: null }, VIDEO), /isn't in the video's title/);
});

test("a title with the video title's words out of order is rejected", () => {
  assert.throws(() => mapTitle({ title: "Fear Over Faith", series: null, part: null }, VIDEO), /isn't in the video's title/);
});

test("a series or part with a word of its own is rejected too", () => {
  assert.throws(() => mapTitle({ title: "Faith Over Fear", series: "Unshakable Faith Series", part: null }, VIDEO), /series/);
});

test("a title keeps the signs between its words", () => {
  assert.equal(mapTitle({ title: "Declare October a Month of Victory & Blessing", series: null, part: null }, "Declare October a Month of Victory & Blessing | Psalms of Gratitude").title,
    "Declare October a Month of Victory & Blessing");
});

test("a title that leaves out a word inside it is rejected", () => {
  assert.throws(() => mapTitle({ title: "Faith Fear", series: null, part: null }, VIDEO), /isn't in the video's title/);
});

test("a part rebuilt longer than a part may be is rejected", () => {
  const padded = `Faith Over Fear (Part ${"-".repeat(80)} 2)`;
  assert.throws(() => mapTitle({ title: "Faith Over Fear", series: null, part: "Part 2" }, padded), /too long/);
});

test("a title keeps its question mark, never the brackets and bars around it", () => {
  assert.deepEqual(mapTitle({ title: "Are you ready?", series: null, part: null }, "ARE YOU READY? | Sunday Service"),
    { title: "Are You Ready?", series: null, part: null });
});

function caller(answers: unknown[]): { call: StageCaller; requests: StageRequest[] } {
  const requests: StageRequest[] = [];
  const call: StageCaller = async (request) => {
    requests.push(request);
    const answer = answers[requests.length - 1];
    return { content: typeof answer === "string" ? answer : JSON.stringify(answer), finishReason: "stop", refusal: null, model: "test-model",
      usage: { promptTokens: 10, cachedTokens: 0, completionTokens: 5, reasoningTokens: 0 } };
  };
  return { call, requests };
}

test("the title step asks again once when its answer isn't the video's words", async () => {
  const { call, requests } = caller([{ title: "Faith Beats Fear", series: null, part: null }, { title: "Faith over fear", series: "Unshakable", part: "Part 2" }]);
  assert.deepEqual(await findSermonTitle(call, { title: VIDEO, church: "VOUS Church" }), { title: "Faith Over Fear", series: "Unshakable", part: "Part 2" });
  assert.equal(requests.length, 2);
  assert.match(requests[1]!.task, /isn't in the video's title/);
});

test("a title step that fails twice gives no title, so the video's own is shown", async () => {
  const { call, requests } = caller(["{broken", { title: "Something New", series: null, part: null }]);
  assert.equal(await findSermonTitle(call, { title: VIDEO, church: null }), null);
  assert.equal(requests.length, 2);
});
