import { RISE_FIRST_DAY, riseDayNumber, riseQuestions } from "@/entities/rise/logic/rise-day";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("riseDayNumber", () => {
  it("is day 1 for the whole of the first UTC day", () => {
    expect(riseDayNumber(RISE_FIRST_DAY)).toBe(1);
    expect(riseDayNumber(RISE_FIRST_DAY + DAY_MS - 1)).toBe(1);
  });

  it("turns over at UTC midnight, for everyone at once", () => {
    expect(riseDayNumber(RISE_FIRST_DAY + DAY_MS)).toBe(2);
    expect(riseDayNumber(RISE_FIRST_DAY + 40 * DAY_MS + 5)).toBe(41);
  });

  it("never goes below day 1", () => {
    expect(riseDayNumber(RISE_FIRST_DAY - DAY_MS)).toBe(1);
  });
});

describe("riseQuestions", () => {
  it("gives six questions, the same for the same day", () => {
    expect(riseQuestions(1)).toHaveLength(6);
    expect(riseQuestions(7)).toEqual(riseQuestions(7));
  });

  it("gives different questions on different days of a cycle", () => {
    const days = Array.from({ length: 10 }, (_, index) =>
      riseQuestions(index + 1)
        .map((question) => question.id)
        .join(),
    );
    expect(new Set(days).size).toBe(10);
  });

  it("keeps the right answer right after the answers are placed", () => {
    for (let day = 1; day <= 10; day += 1) {
      for (const question of riseQuestions(day)) {
        expect(question.answers).toHaveLength(2);
        expect(question.answers).toContain(question.rightAnswer);
        expect(question.answers[question.right]).toBe(question.rightAnswer);
      }
    }
  });

  it("runs on past the schedule's end, starting it again", () => {
    expect(riseQuestions(100_000)).toHaveLength(6);
  });
});
