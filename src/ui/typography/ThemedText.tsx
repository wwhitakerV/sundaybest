import type { ReactNode } from "react";
import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native";

import { useTheme } from "@/theme";
import { scaleTypeStyle, toneColor, type Tone } from "./tone";
import { useTextScale } from "./use-text-scale";

/** What a caller may style: where the text sits, never its face, size, weight, leading, tracking or colour. */
export type LayoutTextStyle = Omit<
  TextStyle,
  "fontFamily" | "fontSize" | "fontWeight" | "fontStyle" | "lineHeight" | "letterSpacing" | "color"
> & {
  // Named as never, not only left out, so a stylesheet entry that sets one is a type error.
  fontFamily?: never;
  fontSize?: never;
  fontWeight?: never;
  fontStyle?: never;
  lineHeight?: never;
  letterSpacing?: never;
  color?: never;
};

/** Props every typography component takes. */
export type TypographyProps = Omit<TextProps, "style"> & {
  tone?: Tone;
  style?: StyleProp<LayoutTextStyle>;
  children?: ReactNode;
};

/**
 * The one place text is drawn: a type style from the theme, a semantic
 * tone, and a layout-only style on top. Private to `src/ui/typography`;
 * everything else uses the named components built on it.
 */
export function ThemedText({
  type,
  tone = "text",
  style,
  ...props
}: TypographyProps & { type: TextStyle }) {
  const theme = useTheme();
  const scale = useTextScale();

  return (
    <Text
      {...props}
      style={[scaleTypeStyle(type, scale), { color: toneColor(theme.colors, tone) }, style]}
    />
  );
}
