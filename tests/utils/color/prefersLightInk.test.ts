import { prefersLightInk } from "@/utils/color/prefersLightInk";

describe("prefersLightInk", () => {
  it("sets white on a dark colour", () => {
    expect(prefersLightInk("#3D403F")).toBe(true);
    expect(prefersLightInk("#000000")).toBe(true);
    expect(prefersLightInk("#1E3A5F")).toBe(true);
  });

  it("sets black on a light colour", () => {
    expect(prefersLightInk("#FFFFFF")).toBe(false);
    expect(prefersLightInk("#F5E6C8")).toBe(false);
    expect(prefersLightInk("#FFD400")).toBe(false);
  });

  it("reads three-digit hex, and hex in lower case", () => {
    expect(prefersLightInk("#333")).toBe(true);
    expect(prefersLightInk("#eee")).toBe(false);
  });

  it("falls back to white for a colour it can't read", () => {
    expect(prefersLightInk("graphite")).toBe(true);
  });
});
