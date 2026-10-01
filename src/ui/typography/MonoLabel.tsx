import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type MonoLabelVariant = "label" | "labelTracked" | "date" | "dayStrip" | "emphasis";

export type MonoLabelProps = TypographyProps & { variant?: MonoLabelVariant };

function typeFor(typography: Theme["typography"], variant: MonoLabelVariant) {
  switch (variant) {
    case "label":
      return typography.metaLabel;
    case "labelTracked":
      return typography.metaLabelTracked;
    case "date":
      return typography.tileDate;
    case "dayStrip":
      return typography.dayStrip;
    case "emphasis":
      return typography.metaEmphasis;
  }
}

/** Short labels in the mono, IBM Plex Mono: meta, dates, the weekday strip, emphasis. */
export function MonoLabel({ variant = "label", ...props }: MonoLabelProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
