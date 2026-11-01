import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type MonoLabelVariant =
  | "label"
  | "labelTracked"
  | "labelTrackedStrong"
  | "date"
  | "dayStrip"
  | "headerDate"
  | "emphasis"
  | "kicker"
  | "folio";

export type MonoLabelProps = TypographyProps & { variant?: MonoLabelVariant };

function typeFor(typography: Theme["typography"], variant: MonoLabelVariant) {
  switch (variant) {
    case "label":
      return typography.metaLabel;
    case "labelTracked":
      return typography.metaLabelTracked;
    case "labelTrackedStrong":
      return typography.metaLabelTrackedStrong;
    case "date":
      return typography.tileDate;
    case "dayStrip":
      return typography.dayStrip;
    case "headerDate":
      return typography.headerDate;
    case "emphasis":
      return typography.metaEmphasis;
    case "kicker":
      return typography.kicker;
    case "folio":
      return typography.folioMeta;
  }
}

/** Short labels in the interface face, Söhne, often tracked capitals (it was the mono's role): meta, dates, the weekday strip, emphasis. */
export function MonoLabel({ variant = "label", ...props }: MonoLabelProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
