import { isSearchEarned } from "@/utils/search/isSearchEarned";

describe("isSearchEarned", () => {
  it("keeps search away while the list is shorter than its threshold", () => {
    expect(isSearchEarned({ count: 9, threshold: 10, shownBefore: false })).toBe(false);
  });

  it("offers search once the list reaches its threshold", () => {
    expect(isSearchEarned({ count: 10, threshold: 10, shownBefore: false })).toBe(true);
  });

  it("offers search past its threshold", () => {
    expect(isSearchEarned({ count: 40, threshold: 10, shownBefore: false })).toBe(true);
  });

  it("keeps search once it's been offered, though the list has shrunk", () => {
    expect(isSearchEarned({ count: 3, threshold: 10, shownBefore: true })).toBe(true);
  });

  it("keeps search away from an empty list that's never earned it", () => {
    expect(isSearchEarned({ count: 0, threshold: 2, shownBefore: false })).toBe(false);
  });
});
