import { getStepState } from "@/utils/steps/getStepState";

describe("getStepState", () => {
  it("marks steps before the active one as completed", () => {
    expect(getStepState(0, 2)).toBe("completed");
  });

  it("marks the active step as active", () => {
    expect(getStepState(2, 2)).toBe("active");
  });

  it("marks steps after the active one as upcoming", () => {
    expect(getStepState(3, 2)).toBe("upcoming");
  });

  it("treats every step as upcoming before the flow starts", () => {
    expect(getStepState(0, -1)).toBe("upcoming");
  });
});
