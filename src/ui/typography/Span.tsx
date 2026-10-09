import type { ReactNode } from "react";
import { Text, type StyleProp, type TextProps } from "react-native";

import { useTheme } from "@/theme";
import type { LayoutTextStyle } from "./ThemedText";
import { toneColor, type Tone } from "./tone";

export type SpanProps = Omit<TextProps, "style"> & {
  /** Its own tone; without one, it keeps its line's. */
  tone?: Tone;
  /** Its words in italic — a blank to fill, a term set apart. */
  italic?: boolean;
  /** Its words in the medium weight — what a search found, in a regular line. */
  match?: boolean;
  /** Layout and decoration only (an underline), never type or colour. */
  style?: StyleProp<LayoutTextStyle>;
  children?: ReactNode;
};

/**
 * Part of a line, nested inside a typography component: it keeps the
 * line's type and, if given one, takes a tone of its own — "Day 2" then a
 * muted "Read". Groups words under a key, too.
 */
export function Span({ tone, italic = false, match = false, style, ...props }: SpanProps) {
  const theme = useTheme();
  const color = tone ? toneColor(theme.colors, tone) : undefined;
  return (
    <Text
      {...props}
      style={[
        color !== undefined && { color },
        italic && { fontStyle: "italic" },
        match && theme.typography.match,
        style,
      ]}
    />
  );
}
