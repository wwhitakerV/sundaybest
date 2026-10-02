import { getHeroPalette } from "@/entities/plan/logic/hero-palette";
import { getBackdropStops } from "@/utils/color/getBackdropStops";

const FALLBACK = "#808080";

describe("getHeroPalette", () => {
  it("takes the sermon's first colour as its colour", () => {
    expect(getHeroPalette(["#48443F", "#111117"], FALLBACK).colour).toBe("#48443F");
  });

  it("falls back when the sermon has no colours", () => {
    expect(getHeroPalette([], FALLBACK).colour).toBe(FALLBACK);
  });

  it("builds its gradient stops from the colours and fallback", () => {
    const colors = ["#48443F", "#654F46", "#111117"];

    expect(getHeroPalette(colors, FALLBACK).stops).toEqual(getBackdropStops(colors, FALLBACK));
  });

  it("builds its stops from the fallback when there are no colours", () => {
    expect(getHeroPalette([], FALLBACK).stops).toEqual(getBackdropStops([], FALLBACK));
  });

  it("asks for light ink on a dark colour", () => {
    const palette = getHeroPalette(["#111117"], FALLBACK);

    expect(palette.light).toBe(true);
  });

  it("asks for dark ink on a light colour", () => {
    const palette = getHeroPalette(["#F4F1EA"], FALLBACK);

    expect(palette.light).toBe(false);
  });

  it("takes its ink from the first colour, the hero's own", () => {
    expect(getHeroPalette(["#111117", "#F4F1EA"], FALLBACK).light).toBe(true);
  });

  it("takes its ink from the fallback when the sermon has no colours", () => {
    expect(getHeroPalette([], "#111117").light).toBe(true);
  });
});
