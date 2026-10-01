import { StatusBar } from "react-native";

import { useTheme } from "@/theme";

export type PlanStatusBarProps = {
  /** Whether the page, not the hero, is under it now. */
  overPage: boolean;
  /** Whether the sermon's colour wants light type. */
  light: boolean;
};

/** Plan Detail's status bar, set for what's under it: the sermon's colour, or the page. */
export function PlanStatusBar({ overPage, light }: PlanStatusBarProps) {
  const theme = useTheme();
  const lightContent = overPage ? theme.name === "dark" : light;

  return <StatusBar animated barStyle={lightContent ? "light-content" : "dark-content"} />;
}
