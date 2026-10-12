import { StyleSheet } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { TextField } from "@/ui/typography/TextField";

/** The edge every field and box has. */
const EDGE = 1;

export type TextBoxProps = {
  value: string;
  onChangeText: (value: string) => void;
  /** What it says while empty. */
  placeholder: string;
  /** What it's for, for VoiceOver. */
  accessibilityLabel: string;
  /** Its least height, for the room its place gives: it grows as the words do. */
  minHeight: number;
  /** Open with the keyboard up: a box the reader came to write in. */
  autoFocus?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  maxLength?: number;
  testID: string;
};

/**
 * Every box you write in, several lines tall: the one-line fields' soft fill
 * and card edge, 24pt corners, its words from the top. The whole box is the
 * input, so a tap anywhere in it starts writing.
 */
export function TextBox({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  minHeight,
  autoFocus = false,
  autoCapitalize = "sentences",
  maxLength,
  testID,
}: TextBoxProps) {
  const theme = useTheme();

  return (
    <TextField
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTone="supporting"
      multiline
      autoFocus={autoFocus}
      autoCapitalize={autoCapitalize}
      {...(maxLength !== undefined && { maxLength })}
      style={[
        styles.box,
        {
          minHeight,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.containerBorder,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: EDGE,
    borderRadius: radius[24],
    padding: space[16],
    textAlignVertical: "top",
  },
});
