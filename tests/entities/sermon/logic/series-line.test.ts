import { seriesLine } from "@/entities/sermon";

describe("seriesLine", () => {
  it("names the series and the part", () => {
    expect(seriesLine({ series: "Unshakable", part: "Part II" })).toBe("Unshakable · Part II");
  });

  it("names the series alone when the title gives no part", () => {
    expect(seriesLine({ series: "Unshakable", part: null })).toBe("Unshakable");
  });

  it("names the part alone when the title gives no series", () => {
    expect(seriesLine({ series: null, part: "Part 2" })).toBe("Part 2");
  });

  it("is nothing for a sermon from no series", () => {
    expect(seriesLine({ series: null, part: null })).toBeNull();
  });
});
