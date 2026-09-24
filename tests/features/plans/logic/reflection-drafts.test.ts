import type { Reflection } from "@/types/domain";

import { getReflectionWrites } from "@/features/plans/logic/reflection-drafts";

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
