import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type StatusLabelVariant = "time" | "colon" | "figures";

export type StatusLabelProps = TypographyProps & {
  variant: StatusLabelVariant;
  /** Its figures in italic: the battery in Low Power Mode. */
  italic?: boolean;
};

function typeFor(typography: Theme["typography"], variant: StatusLabelVariant) {
  switch (variant) {
    case "time":
      return typography.statusBarTime;
    case "colon":
      return typography.statusBarColon;
    case "figures":
      return typography.statusBarFigures;
  }
}

/**
 * The status bar's words, in the editorial face: its time (and the time's
 * colon) and the battery's percentage. Always its designed size: the bar never
 * grows with the reader's text size or iOS's, as iOS's own bar doesn't.
 */
export function StatusLabel({ variant, italic = false, ...props }: StatusLabelProps) {
  const { typography } = useTheme();
  const type = typeFor(typography, variant);
  return <ThemedText fixed type={italic ? { ...type, fontStyle: "italic" } : type} {...props} />;
}
