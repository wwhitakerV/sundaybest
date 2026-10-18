import launchColors from "@/theme/launch-colors.json";
import { LAUNCH_PAGE } from "@/theme/launch-colors";
import { darkTheme, lightTheme } from "@/theme/tokens";

describe("the launch's page colour", () => {
  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("comes from launch-colors in the %s theme", (_name, theme) => {
    expect(theme.colors.launchPage).toBe(LAUNCH_PAGE);
  });

  it("is the colour launch-colors holds, which the native launch screen reads too", () => {
    expect(LAUNCH_PAGE).toBe(launchColors.page);
  });

  it("is all launch-colors holds: one intro, one colour", () => {
    expect(Object.keys(launchColors)).toEqual(["page"]);
  });
});
