/// <reference types="node" />
// Builds RISE's daily schedule: checks the bank (scripts/rise/questions.json),
// keeps every day already in the schedule exactly as it is, adds whole cycles
// until it runs a year and more past day 1, checks every rule on every day,
// and writes the bank and schedule the app reads (src/entities/rise/data).
// Run it after any change to the bank: `npm run build:rise`. A test fails until it's run.
//
// It fails, writing nothing, rather than bend a rule. A question is never
// deleted from the bank once scheduled — fix its words in place.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bankSchema, scheduleSchema } from "../../src/entities/rise/logic/schedule/bank";
import { extendSchedule } from "../../src/entities/rise/logic/schedule/extend-schedule";
import { scheduleProblems } from "../../src/entities/rise/logic/schedule/schedule-problems";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCE = join(ROOT, "scripts/rise/questions.json");
const BANK = join(ROOT, "src/entities/rise/data/rise-bank.json");
const SCHEDULE = join(ROOT, "src/entities/rise/data/rise-schedule.json");
/** How far the schedule must run: a year, and a cycle more. */
const LEAST_DAYS = 375;

const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const bank = bankSchema.parse(read(SOURCE));
const existing = existsSync(SCHEDULE) ? scheduleSchema.parse(read(SCHEDULE)) : { days: [] };
const schedule = extendSchedule(existing, bank, LEAST_DAYS);
const problems = scheduleProblems(schedule, bank);
if (problems.length > 0) {
  process.stderr.write(
    `RISE's schedule breaks ${problems.length} rules:\n  ${problems.join("\n  ")}\n`,
  );
  process.exit(1);
}
writeFileSync(BANK, `${JSON.stringify(bank, null, 2)}\n`);
writeFileSync(SCHEDULE, `${JSON.stringify(schedule)}\n`);
process.stdout.write(
  `RISE: ${bank.length} questions, ${schedule.days.length} days (${schedule.days.length - existing.days.length} new).\n`,
);
