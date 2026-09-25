import { getBackdropStops } from "@/utils/color/getBackdropStops";

const FALLBACK = "#111113";

describe("getBackdropStops", () => {
  it("sweeps from the accent, through the main colour, into the anchor", () => {
    expect(getBackdropStops(["#3D403F", "#1F5A6E", "#1C1D20"], FALLBACK)).toEqual([
      { offset: 0, color: "#1F5A6E" },
      { offset: 0.5, color: "#3D403F" },
      { offset: 1, color: "#1C1D20" },
    ]);
  });

  it("sweeps from the accent into the main colour when there are two", () => {
    expect(getBackdropStops(["#3D403F", "#1F5A6E"], FALLBACK)).toEqual([
      { offset: 0, color: "#1F5A6E" },
      { offset: 1, color: "#3D403F" },
    ]);
  });

  it("holds one colour flat", () => {
    expect(getBackdropStops(["#3D403F"], FALLBACK)).toEqual([
      { offset: 0, color: "#3D403F" },
      { offset: 1, color: "#3D403F" },
    ]);
  });

  it("holds the fallback flat when no colours are known", () => {
    expect(getBackdropStops([], FALLBACK)).toEqual([
      { offset: 0, color: FALLBACK },
      { offset: 1, color: FALLBACK },
    ]);
  });
});
