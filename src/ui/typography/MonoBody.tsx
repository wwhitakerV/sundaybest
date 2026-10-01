import { useTheme, type Theme } from "@/theme";
import { ThemedText, type TypographyProps } from "./ThemedText";

export type MonoBodyVariant = "body" | "supporting" | "counter";

export type MonoBodyProps = TypographyProps & { variant?: MonoBodyVariant };

function typeFor(typography: Theme["typography"], variant: MonoBodyVariant) {
  switch (variant) {
    case "body":
      return typography.metaBody;
    case "supporting":
      return typography.supporting;
    case "counter":
      return typography.stepCounter;
  }
}

/** Running text in the mono, IBM Plex Mono: meta body, supporting copy and footnotes, a step counter. */
export function MonoBody({ variant = "body", ...props }: MonoBodyProps) {
  const { typography } = useTheme();
  return <ThemedText type={typeFor(typography, variant)} {...props} />;
}
