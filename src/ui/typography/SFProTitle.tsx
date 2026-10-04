import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SFProTitleVariant =
  | "screen"
  | "headline"
  | "headlineRegular"
  | "section"
  | "card"
  | "smallCardTitle"
  | "step"
  | "nav"
  | "preview";

export type SFProTitleProps = TypographyProps & { variant?: SFProTitleVariant };

function typeFor(typography: Theme["typography"], variant: SFProTitleVariant) {
  switch (variant) {
    case "screen":
      return typography.screenTitle;
    case "headline":
      return typography.headline;
    case "headlineRegular":
      return typography.headlineRegular;
    case "section":
      return typography.sectionTitle;
    case "card":
      return typography.cardTitle;
    case "smallCardTitle":
      return typography.smallCardTitle;
    case "step":
      return typography.stepTitle;
    case "nav":
      return typography.navTitle;
    case "preview":
      return typography.listItemLarge;
  }
}

/** Titles in the system face, SF Pro: a screen's, a section's, a card's, a step's, the nav bar's. */
export function SFProTitle({ variant = "screen", ...props }: SFProTitleProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
