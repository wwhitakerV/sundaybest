import assert from "node:assert/strict";
import test from "node:test";
import { generationProgress, type BuildProgress } from "../src/worker/generation-progress.js";

const build = (overrides: Partial<BuildProgress>): BuildProgress =>
  ({ status: "preparing", lengthDays: 4, quickCheckEnabled: true, daysWritten: 0, quizzesWritten: 0, ...overrides });

test("a build's progress only ever moves forward, from 0 to 100", () => {
  const steps: Array<Partial<BuildProgress>> = [
    { status: "preparing" }, { status: "processingSermon" }, { status: "findingScripture" },
    { status: "writingDays" }, { status: "writingDays", daysWritten: 2 }, { status: "writingDays", daysWritten: 4 },
    { status: "buildingQuiz", daysWritten: 4 }, { status: "buildingQuiz", daysWritten: 4, quizzesWritten: 3 },
    { status: "completed", daysWritten: 4, quizzesWritten: 4 },
  ];
  const percents = steps.map((step) => generationProgress(build(step)));
  assert.equal(percents[0], 0);
  assert.equal(percents.at(-1), 100);
  assert.ok(percents.every((percent, index) => index === 0 || percent >= percents[index - 1]!), percents.join(","));
});

test("each day written moves it forward", () => {
  assert.ok(generationProgress(build({ status: "writingDays", daysWritten: 1 })) > generationProgress(build({ status: "writingDays" })));
});

test("without Quick Check, the days carry it almost to the end", () => {
  assert.ok(generationProgress(build({ status: "writingDays", daysWritten: 4, quickCheckEnabled: false })) >= 90);
  assert.ok(generationProgress(build({ status: "writingDays", daysWritten: 4 })) < 80);
});

test("a failed build keeps no progress of its own", () => {
  assert.equal(generationProgress(build({ status: "failed", daysWritten: 2 })), 0);
});
