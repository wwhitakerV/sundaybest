import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SerifBodyVariant = "scripture" | "standfirst" | "line";

export type SerifBodyProps = TypographyProps & { variant?: SerifBodyVariant };

function typeFor(typography: Theme["typography"], variant: SerifBodyVariant) {
  switch (variant) {
    case "scripture":
      return typography.scripture;
    case "standfirst":
      return typography.standfirst;
    case "line":
      return typography.scriptureLine;
  }
}

/** Reading in the editorial face, Libre Baskerville Regular: a passage of Scripture, a prayer, or a standfirst. */
export function SerifBody({ variant = "scripture", ...props }: SerifBodyProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
