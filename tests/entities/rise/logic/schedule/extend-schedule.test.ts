import questions from "../../../../../scripts/rise/questions.json";
import { bankSchema } from "@/entities/rise/logic/schedule/bank";
import { extendSchedule } from "@/entities/rise/logic/schedule/extend-schedule";
import { scheduleProblems } from "@/entities/rise/logic/schedule/schedule-problems";

const bank = bankSchema.parse(questions);

describe("extendSchedule", () => {
  it("adds whole cycles until it has at least the days asked for", () => {
    const schedule = extendSchedule({ days: [] }, bank, 25);
    expect(schedule.days).toHaveLength(30);
    expect(schedule.days.map((day) => day.cycle)).toEqual([
      ...Array<number>(10).fill(1),
      ...Array<number>(10).fill(2),
      ...Array<number>(10).fill(3),
    ]);
    expect(scheduleProblems(schedule, bank)).toEqual([]);
  });

  it("never changes a day already published", () => {
    const first = extendSchedule({ days: [] }, bank, 10);
    const edited = { days: first.days.map((day, index) => (index === 0 ? first.days[3]! : day)) };
    const longer = extendSchedule(edited, bank, 20);
    expect(longer.days.slice(0, 10)).toEqual(edited.days);
  });

  it("asks nothing again until the whole bank has been asked", () => {
    const schedule = extendSchedule({ days: [] }, bank, 10);
    const ids = schedule.days.flatMap((day) => day.questions.map((question) => question.id));
    expect(new Set(ids).size).toBe(60);
  });
});

describe("scheduleProblems", () => {
  const schedule = extendSchedule({ days: [] }, bank, 10);

  it("finds a question no longer in the bank", () => {
    const broken = structuredClone(schedule);
    broken.days[0]!.questions[0]!.id = "rise-777";
    expect(scheduleProblems(broken, bank)).toContain("day 1: rise-777 isn't in the bank");
  });

  it("finds a question asked twice in one cycle", () => {
    const broken = structuredClone(schedule);
    broken.days[1]!.questions[0]!.id = broken.days[0]!.questions[0]!.id;
    expect(scheduleProblems(broken, bank)).toEqual(
      expect.arrayContaining([expect.stringMatching(/asked again in cycle 1/)]),
    );
  });

  it("finds a day whose rules or sides are broken", () => {
    const broken = structuredClone(schedule);
    for (const question of broken.days[2]!.questions) question.correctOnLeft = true;
    expect(scheduleProblems(broken, bank)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^day 3: the right answer is on the left 6/)]),
    );
  });
});

describe("scheduleProblems on the bank", () => {
  it("finds an id in the bank twice, and a conflict with a question that isn't there", () => {
    const twice = [...bank, { ...bank[0]!, conflicts: ["rise-888"] }];
    const problems = scheduleProblems({ days: [] }, twice);
    expect(problems).toContain("rise-001 is in the bank twice");
    expect(problems).toContain("rise-001 conflicts with rise-888, which isn't in the bank");
  });
});
