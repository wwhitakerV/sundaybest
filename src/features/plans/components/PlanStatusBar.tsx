import { useTheme } from "@/theme";
import { StatusBarTone } from "@/ui/organisms/status-bar/tone";

export type PlanStatusBarProps = {
  /** Whether the page, not the hero, is under it now. */
  overPage: boolean;
  /** Whether the sermon's colour wants light type. */
  light: boolean;
};

/** Plan Detail's status bar, set for what's under it: the sermon's colour, or the page. */
export function PlanStatusBar({ overPage, light }: PlanStatusBarProps) {
  const theme = useTheme();
  return <StatusBarTone light={overPage ? theme.name === "dark" : light} />;
}
