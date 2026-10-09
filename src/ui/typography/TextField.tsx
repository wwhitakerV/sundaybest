import { TextInput, type StyleProp, type TextInputProps } from "react-native";

import { useTheme } from "@/theme";
import type { LayoutTextStyle } from "./ThemedText";
import { scaleTypeStyle } from "./tone";
import { useTextOffset } from "./TextSizeScope";
import { useTextScale } from "./use-text-scale";

export type TextFieldProps = Omit<TextInputProps, "style" | "placeholderTextColor"> & {
  /** The placeholder's grey: muted by default; supporting where it must read clearly (a search). */
  placeholderTone?: "muted" | "supporting";
  /** Its box: border, padding, size. Never its type or colour. */
  style?: StyleProp<LayoutTextStyle>;
};

/** A text input in body type and the text colour, its placeholder muted. */
export function TextField({ style, placeholderTone = "muted", ...props }: TextFieldProps) {
  const theme = useTheme();
  const scale = useTextScale();
  const offset = useTextOffset();

  return (
    <TextInput
      placeholderTextColor={
        placeholderTone === "supporting" ? theme.colors.textSupporting : theme.colors.textMuted
      }
      {...props}
      style={[
        scaleTypeStyle(theme.typography.body, scale, offset),
        { color: theme.colors.text },
        style,
      ]}
    />
  );
}
