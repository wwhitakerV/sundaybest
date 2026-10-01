import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SFProLabelVariant =
  | "button"
  | "compactButton"
  | "segment"
  | "segmentActive"
  | "filter"
  | "filterCount"
  | "tag"
  | "stepLabel"
  | "tileNumber"
  | "statusTime";

export type SFProLabelProps = TypographyProps & { variant?: SFProLabelVariant };

function typeFor(typography: Theme["typography"], variant: SFProLabelVariant) {
  switch (variant) {
    case "button":
      return typography.button;
    case "compactButton":
      return typography.compactButton;
    case "segment":
      return typography.segmentLabel;
    case "segmentActive":
      return typography.segmentLabelActive;
    case "filter":
      return typography.filterLabel;
    case "filterCount":
      return typography.filterCount;
    case "tag":
      return typography.tag;
    case "stepLabel":
      return typography.stepLabel;
    case "tileNumber":
      return typography.tileNumber;
    case "statusTime":
      return typography.statusTime;
  }
}

/** Control and UI labels in the system face, SF Pro: buttons, segments, filters, tags, steps, tiles. */
export function SFProLabel({ variant = "button", ...props }: SFProLabelProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
