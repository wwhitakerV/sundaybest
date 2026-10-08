import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type SFProBodyVariant =
  "body" | "bodyLoose" | "listItem" | "label" | "reading" | "detail" | "letter";

export type SFProBodyProps = TypographyProps & { variant?: SFProBodyVariant };

function typeFor(typography: Theme["typography"], variant: SFProBodyVariant) {
  switch (variant) {
    case "body":
      return typography.body;
    case "bodyLoose":
      return typography.bodyLoose;
    case "listItem":
      return typography.listItem;
    case "label":
      return typography.label;
    case "reading":
      return typography.reading;
    case "detail":
      return typography.cardDetail;
    case "letter":
      return typography.dayLetter;
  }
}

/** Running text in the system face, SF Pro: body, list items, labels, reading, supporting detail. */
export function SFProBody({ variant = "body", ...props }: SFProBodyProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
