import questions from "../../../../scripts/rise/questions.json";
import bankInApp from "@/entities/rise/data/rise-bank.json";
import scheduleInApp from "@/entities/rise/data/rise-schedule.json";
import { bankSchema, scheduleSchema } from "@/entities/rise/logic/schedule/bank";
import { scheduleProblems } from "@/entities/rise/logic/schedule/schedule-problems";

describe("RISE's bundled schedule", () => {
  const bank = bankSchema.parse(bankInApp);
  const schedule = scheduleSchema.parse(scheduleInApp);

  it("carries the bank as it is in scripts/rise (run npm run build:rise after an edit)", () => {
    expect(bank).toEqual(bankSchema.parse(questions));
  });

  it("keeps every rule on every day", () => {
    expect(scheduleProblems(schedule, bank)).toEqual([]);
  });

  it("asks all 60 questions in its first ten days", () => {
    const ids = schedule.days
      .slice(0, 10)
      .flatMap((day) => day.questions.map((question) => question.id));
    expect(new Set(ids).size).toBe(60);
  });

  it("runs at least a year", () => {
    expect(schedule.days.length).toBeGreaterThanOrEqual(365);
  });
});
