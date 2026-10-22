import { questionProblems } from "@/entities/rise/logic/schedule/question-rules";
import { riseQuestion } from "./rise-question";

describe("questionProblems", () => {
  it("passes a short question with two short answers and a fact", () => {
    expect(questionProblems(riseQuestion("rise-001", "animals", "easy"))).toEqual([]);
  });

  it("needs two different answers", () => {
    const question = riseQuestion("rise-001", "animals", "easy", { options: ["Venus", "Venus"] });
    expect(questionProblems(question)).toContain("rise-001: its two answers are the same");
  });

  it("keeps answers short enough for a balloon", () => {
    const question = riseQuestion("rise-001", "animals", "easy", {
      options: ["Hippopotamuses", "Cat"],
    });
    expect(questionProblems(question)).toContain(
      'rise-001: "Hippopotamuses" is longer than 11 letters',
    );
  });

  it("allows up to three words an answer", () => {
    const question = riseQuestion("rise-001", "animals", "easy", { options: ["A b c d", "Cat"] });
    expect(questionProblems(question)).toContain('rise-001: "A b c d" is more than three words');
  });

  it("keeps the question short enough to read in a moment", () => {
    const question = riseQuestion("rise-001", "animals", "easy", { question: "W".repeat(80) });
    expect(questionProblems(question)).toContain("rise-001: the question is over 64 characters");
  });
});
