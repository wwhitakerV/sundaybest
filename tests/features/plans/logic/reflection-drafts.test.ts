import type { Reflection } from "@/types/domain";

import { getAnswer, getReflectionWrites } from "@/features/plans/logic/reflection-drafts";

function reflection(id: string, answer: string | null): Reflection {
  return {
    id,
    createdAt: "2026-09-21T19:41:30.000Z",
    updatedAt: "2026-09-21T19:41:30.000Z",
    planDayId: "day-1",
    order: 1,
    question: "What are you still trying to pay for?",
    answer,
    answeredAt: answer === null ? null : "2026-09-23T06:40:00.000Z",
  };
}

describe("getReflectionWrites", () => {
  it("writes nothing for a question the user hasn't typed in", () => {
    expect(getReflectionWrites([reflection("r1", null)], {})).toEqual([]);
  });

  it("saves a first answer", () => {
    expect(getReflectionWrites([reflection("r1", null)], { r1: "My good mornings." })).toEqual([
      { kind: "save", reflectionId: "r1", answer: "My good mornings." },
    ]);
  });

  it("updates an answer the user has changed", () => {
    expect(getReflectionWrites([reflection("r1", "Before.")], { r1: "After." })).toEqual([
      { kind: "update", reflectionId: "r1", answer: "After." },
    ]);
  });

  it("writes nothing when the draft is the answer already saved", () => {
    expect(getReflectionWrites([reflection("r1", "Same.")], { r1: "Same." })).toEqual([]);
  });

  it("writes nothing for a blank draft on a question not yet answered", () => {
    expect(getReflectionWrites([reflection("r1", null)], { r1: "   " })).toEqual([]);
  });

  it("clears an answer the user has emptied", () => {
    expect(getReflectionWrites([reflection("r1", "Before.")], { r1: "  " })).toEqual([
      { kind: "clear", reflectionId: "r1" },
    ]);
  });

  it("goes through every question with a draft, in order", () => {
    const writes = getReflectionWrites([reflection("r1", null), reflection("r2", "Old.")], {
      r1: "First.",
      r2: "New.",
    });

    expect(writes.map((write) => write.reflectionId)).toEqual(["r1", "r2"]);
  });
});

describe("getAnswer", () => {
  it("returns the draft when one was typed", () => {
    expect(getAnswer("r1", { r1: "Draft" }, [reflection("r1", "Saved")])).toBe("Draft");
  });

  it("returns an empty draft rather than the saved answer", () => {
    expect(getAnswer("r1", { r1: "" }, [reflection("r1", "Saved")])).toBe("");
  });

  it("returns the saved answer when there is no draft", () => {
    expect(getAnswer("r1", {}, [reflection("r1", "Saved")])).toBe("Saved");
  });

  it("returns an empty string when unanswered and untyped", () => {
    expect(getAnswer("r1", {}, [reflection("r1", null)])).toBe("");
  });

  it("returns an empty string for an unknown reflection", () => {
    expect(getAnswer("nope", {}, [reflection("r1", "Saved")])).toBe("");
  });

  it("ignores drafts for other questions", () => {
    expect(getAnswer("r1", { r2: "Other" }, [reflection("r1", "Saved")])).toBe("Saved");
  });
});
