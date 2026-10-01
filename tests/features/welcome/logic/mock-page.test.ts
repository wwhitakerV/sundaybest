import { getBodyElapsedMs } from "@/features/welcome/logic/mock-page";

describe("getBodyElapsedMs", () => {
  it("returns the turn's elapsed time when the body shown is the current step", () => {
    expect(getBodyElapsedMs(2, 2, 1234)).toBe(1234);
  });

  it("returns Infinity when an earlier step's body is still showing", () => {
    expect(getBodyElapsedMs(1, 2, 1234)).toBe(Infinity);
  });

  it("returns 0 when a later step's body is still showing (stepping back)", () => {
    expect(getBodyElapsedMs(3, 2, 1234)).toBe(0);
  });
});
