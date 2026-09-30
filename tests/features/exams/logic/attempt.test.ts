import { hasBegun } from "@/features/exams/logic/attempt";
describe("hasBegun", () => {
  it("is false for an attempt with no answer given yet", () => {
    expect(hasBegun({ responses: [] })).toBe(false);
  });

  it("is true once any answer's been given", () => {
    expect(hasBegun({ responses: [{}] })).toBe(true);
  });
});
