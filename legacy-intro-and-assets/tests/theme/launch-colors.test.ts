import launchColors from "@/theme/launch-colors.json";
import { LAUNCH_COLORS, LAUNCH_INTRO } from "@/theme/launch-colors";
import { darkTheme, lightTheme } from "@/theme/tokens";

describe("the launch's colours", () => {
  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("come from launch-colors in the %s theme", (_name, theme) => {
    expect(theme.colors.launchPage).toBe(LAUNCH_COLORS.page);
    expect(theme.colors.launchInk).toBe(LAUNCH_COLORS.ink);
  });

  it("plays the intro launch-colors names", () => {
    expect(LAUNCH_INTRO).toBe(launchColors.intro);
  });

  it("are the colours of the intro that plays, so one switch changes both", () => {
    // Each movie has the colours of the intro it films: the pool's and the paint's, the pool's.
    const pool = ["pool", "pool-movie", "paint-movie"].includes(launchColors.intro);
    const palette = pool ? launchColors.pool : launchColors.water;
    expect(LAUNCH_COLORS).toEqual(palette);
  });

  it("names one of the five intros: the paint's movie, the pool's movie, the water's movie, the water, or the pool", () => {
    expect(["paint-movie", "pool-movie", "movie", "water", "pool"]).toContain(LAUNCH_INTRO);
  });

  it("plays the paint intro's movie", () => {
    expect(LAUNCH_INTRO).toBe("paint-movie");
  });

  it("starts the paint intro's movie on the pool's red page", () => {
    expect(LAUNCH_COLORS.page).toBe(launchColors.pool.page);
  });

  it("keep both intros' colours, so either can come back", () => {
    for (const intro of [launchColors.water, launchColors.pool]) {
      expect(Object.keys(intro).sort()).toEqual(["ink", "page"]);
    }
  });
});
