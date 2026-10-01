import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SerifBodyVariant = "scripture";

export type SerifBodyProps = TypographyProps & { variant?: SerifBodyVariant };

function typeFor(typography: Theme["typography"], variant: SerifBodyVariant) {
  switch (variant) {
    case "scripture":
      return typography.scripture;
  }
}

/** Reading in the editorial face, Bodoni Moda Regular: a passage of Scripture, or a prayer. */
export function SerifBody({ variant = "scripture", ...props }: SerifBodyProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
