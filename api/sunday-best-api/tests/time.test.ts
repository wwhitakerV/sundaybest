import assert from "node:assert/strict";
import test from "node:test";

import { addCalendarDays, localDateInTimeZone } from "../src/domain/time.js";

test("adds calendar days without DST drift", () => {
  assert.equal(addCalendarDays("2026-03-07", 1), "2026-03-08");
  assert.equal(addCalendarDays("2026-12-31", 1), "2027-01-01");
});

test("derives local date from server time and timezone", () => {
  const now = new Date("2026-10-03T02:00:00.000Z");
  assert.equal(localDateInTimeZone(now, "America/Chicago"), "2026-10-02");
  assert.equal(localDateInTimeZone(now, "UTC"), "2026-10-03");
});
