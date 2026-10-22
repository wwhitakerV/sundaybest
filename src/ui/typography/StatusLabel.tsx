import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type StatusLabelVariant = "time" | "colon";

export type StatusLabelProps = TypographyProps & { variant: StatusLabelVariant };

function typeFor(typography: Theme["typography"], variant: StatusLabelVariant) {
  switch (variant) {
    case "time":
      return typography.statusBarTime;
    case "colon":
      return typography.statusBarColon;
  }
}

/**
 * The status bar's time, in the editorial face (and the time's colon). Always
 * its designed size: the bar never grows with the reader's text size or
 * iOS's, as iOS's own bar doesn't.
 */
export function StatusLabel({ variant, ...props }: StatusLabelProps) {
  const { typography } = useTheme();
  return <ThemedText fixed type={typeFor(typography, variant)} {...props} />;
}
