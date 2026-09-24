import { getPlanEndsLine } from "@/utils/plans/getPlanEndsLine";

describe("getPlanEndsLine", () => {
  it("asks for a length before one is picked", () => {
    expect(getPlanEndsLine(null)).toBe("Pick how long your plan runs.");
  });

  it("says a 6-day plan ends right before next Sunday", () => {
    expect(getPlanEndsLine(6)).toBe("Ends Saturday, right before next Sunday.");
  });

  it("says which day a shorter plan ends", () => {
    expect(getPlanEndsLine(3)).toBe("Ends Wednesday.");
  });

  it("ends a full week on Sunday", () => {
    expect(getPlanEndsLine(7)).toBe("Ends Sunday.");
  });
});
