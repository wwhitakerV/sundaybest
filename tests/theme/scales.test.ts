import { controlHeight, radius, space } from "@/theme";
import { lightTheme } from "@/theme/tokens";

describe("space", () => {
  it("is the spacing scale, each step named by its own value", () => {
    expect(space).toEqual({
      2: 2,
      4: 4,
      6: 6,
      8: 8,
      10: 10,
      12: 12,
      14: 14,
      15: 15,
      16: 16,
      18: 18,
      20: 20,
      22: 22,
      24: 24,
      28: 28,
      32: 32,
      36: 36,
      40: 40,
    });
  });
});

describe("radius", () => {
  it("is the corner scale, each step named by its own value, plus a pill", () => {
    expect(radius).toEqual({
      10: 10,
      12: 12,
      14: 14,
      16: 16,
      20: 20,
      23: 23,
      24: 24,
      28: 28,
      32: 32,
      36: 36,
      pill: 999,
    });
  });
});

describe("controlHeight", () => {
  it("names the heights a control is built to", () => {
    expect(controlHeight).toEqual({ hitTarget: 44, headerButton: 49, header: 54, button: 61 });
  });
});

describe("the theme's older named scales", () => {
  it("keep their spacing values", () => {
    expect(lightTheme.spacing).toEqual({ xs: 4, sm: 8, md: 16, lg: 24, xl: 32 });
  });

  it("keep their corner values", () => {
    expect(lightTheme.radii).toEqual({ sm: 6, md: 10, lg: 16, card: 20, xl: 24, pill: 999 });
  });
});
