import questions from "../../../../../scripts/rise/questions.json";
import { bankSchema } from "@/entities/rise/logic/schedule/bank";
import { buildCycle } from "@/entities/rise/logic/schedule/build-cycle";
import { dayProblems } from "@/entities/rise/logic/schedule/day-rules";
import { riseQuestion } from "./rise-question";

const bank = bankSchema.parse(questions);

describe("buildCycle", () => {
  it("schedules every question in the bank once, in ten valid days", () => {
    const days = buildCycle(bank, { cycle: 1 });
    expect(days).toHaveLength(10);
    for (const day of days) expect(dayProblems(day)).toEqual([]);
    const ids = days.flat().map((question) => question.id);
    expect(new Set(ids).size).toBe(60);
  });

  it("gives the same days for the same cycle, and different days for another", () => {
    const ids = (cycle: number) =>
      buildCycle(bank, { cycle }).map((day) => day.map((question) => question.id));
    expect(ids(1)).toEqual(ids(1));
    expect(ids(2)).not.toEqual(ids(1));
  });

  it("can build a hundred cycles", () => {
    for (let cycle = 1; cycle <= 100; cycle += 1) {
      expect(buildCycle(bank, { cycle })).toHaveLength(10);
    }
  });

  it("chooses the questions asked least first: a new one makes the next cycle", () => {
    const fresh = riseQuestion("rise-999", "animals", "easy");
    const uses = new Map(bank.map((question) => [question.id, 1]));
    for (let cycle = 1; cycle <= 10; cycle += 1) {
      const ids = buildCycle([...bank, fresh], { cycle, uses })
        .flat()
        .map((question) => question.id);
      expect(ids).toContain("rise-999");
    }
  });

  it("fails rather than bend a rule when a valid day can't be made", () => {
    const easyOnly = bank.filter((question) => question.difficulty !== "hard");
    expect(() => buildCycle(easyOnly, { cycle: 1 })).toThrow("can't make a single day");
  });
});
