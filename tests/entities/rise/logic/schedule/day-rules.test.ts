import { dayProblems } from "@/entities/rise/logic/schedule/day-rules";
import { riseQuestion, validDay } from "./rise-question";

describe("dayProblems", () => {
  it("passes a day of six, easy-medium-easy-medium-medium-hard, in six categories", () => {
    expect(dayProblems(validDay())).toEqual([]);
  });

  it("needs exactly six questions", () => {
    expect(dayProblems(validDay().slice(0, 5))).toContain("6 questions a day, not 5");
  });

  it("needs the difficulties in their order", () => {
    const day = validDay();
    const [first, second] = [day[0]!, day[1]!];
    day[0] = second;
    day[1] = first;
    expect(dayProblems(day)).toContain("question 1 should be easy, not medium");
  });

  it("allows no category more than twice", () => {
    const day = validDay().map((question, index) =>
      index % 2 === 0 ? { ...question, category: "animals" } : question,
    );
    expect(dayProblems(day)).toContain("animals is asked 3 times");
  });

  it("never puts one category twice in a row", () => {
    const day = validDay();
    day[1] = { ...day[1]!, category: "animals" };
    expect(dayProblems(day)).toContain("questions 1 and 2 are both animals");
  });

  it("needs at least four categories", () => {
    const categories = ["a", "b", "c", "a", "b", "c"];
    const day = validDay().map((question, index) => ({
      ...question,
      category: categories[index]!,
    }));
    expect(dayProblems(day)).toContain("only 3 categories");
  });

  it("keeps questions that give each other away on different days, whichever names the other", () => {
    const day = validDay();
    day[5] = riseQuestion("rise-106", "science", "hard", { conflicts: ["rise-101"] });
    expect(dayProblems(day)).toContain("rise-106 gives away rise-101");
    day[5] = riseQuestion("rise-106", "science", "hard");
    day[0] = riseQuestion("rise-101", "animals", "easy", { conflicts: ["rise-106"] });
    expect(dayProblems(day)).toContain("rise-101 gives away rise-106");
  });

  it("never asks one question twice in a day", () => {
    const day = validDay();
    day[2] = { ...day[0]! };
    expect(dayProblems(day)).toContain("rise-101 is asked twice");
  });
});
