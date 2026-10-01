import { TextInput, type StyleProp, type TextInputProps } from "react-native";

import { useTheme } from "@/theme";
import type { LayoutTextStyle } from "./ThemedText";
import { scaleTypeStyle } from "./tone";
import { useTextScale } from "./use-text-scale";

export type TextFieldProps = Omit<TextInputProps, "style" | "placeholderTextColor"> & {
  /** Its box: border, padding, size. Never its type or colour. */
  style?: StyleProp<LayoutTextStyle>;
};

/** A text input in body type and the text colour, its placeholder muted. */
export function TextField({ style, ...props }: TextFieldProps) {
  const theme = useTheme();
  const scale = useTextScale();

  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      {...props}
      style={[scaleTypeStyle(theme.typography.body, scale), { color: theme.colors.text }, style]}
    />
  );
}
