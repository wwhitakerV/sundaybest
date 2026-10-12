import { LAUNCH_COLORS } from "@/theme/launch-colors";
import { darkTheme, lightTheme } from "@/theme/tokens";

describe("the launch's colours", () => {
  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("come from launch-colors in the %s theme", (_name, theme) => {
    expect(theme.colors.launchPage).toBe(LAUNCH_COLORS.page);
    expect(theme.colors.launchInk).toBe(LAUNCH_COLORS.ink);
  });
});
