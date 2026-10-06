import assert from "node:assert/strict";
import test from "node:test";

import { startOfWeekSunday } from "../src/domain/time.js";
import { estimateDayMinutes } from "../src/services/plan-service.js";
import { getStreak } from "../src/services/progress-service.js";

test("derives the Sunday that starts a week", () => {
  assert.equal(startOfWeekSunday("2026-10-04"), "2026-10-04");
  assert.equal(startOfWeekSunday("2026-10-07"), "2026-10-04");
  assert.equal(startOfWeekSunday("2026-10-10"), "2026-10-04");
});

test("streak stays alive through yesterday before today's study", () => {
  const streak = getStreak(["2026-10-01", "2026-10-02", "2026-10-03"], "2026-10-04");
  assert.deepEqual(streak, { current: 3, longest: 3 });
});

test("study time estimate is always a positive whole number", () => {
  const minutes = estimateDayMinutes({
    readingParagraphs: ["Grace changes how we respond to ordinary work."],
    reflectionQuestions: ["What should change today?"],
    prayerText: "Lord, make me faithful today.",
    verseCount: 2,
  });
  assert.equal(Number.isInteger(minutes), true);
  assert.equal(minutes > 0, true);
});
