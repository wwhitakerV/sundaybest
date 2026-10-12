import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { space } from "@/theme";
import { FieldFrame } from "@/ui/atoms/FieldFrame";
import { TextField } from "@/ui/typography/TextField";

export type InputFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  /** What it says while empty. */
  placeholder: string;
  /** What it asks for, for VoiceOver. */
  accessibilityLabel: string;
  /** The quiet mark it leads with. */
  icon?: LucideIcon;
  keyboardType?: "default" | "email-address" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  autoCorrect?: boolean;
  returnKeyType?: "done" | "next" | "go";
  textContentType?: "URL" | "emailAddress" | "name" | "organizationName";
  maxLength?: number;
  /** On the keyboard's return key. */
  onSubmit?: () => void;
  /** What's in it can't be used: its edge goes amber. */
  invalid?: boolean;
  /** A button at its end (New Plan's Paste). */
  end?: ReactNode;
  /** From its end to that button. */
  endInset?: number;
  /** The input's; its frame is `${testID}-field`. */
  testID: string;
};

/**
 * A one-line field: the shared field frame — the search bar's pill, edge and
 * icon — with words typed in it, and room for a button at its end.
 */
export function InputField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  icon,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect,
  returnKeyType,
  textContentType,
  maxLength,
  onSubmit,
  invalid = false,
  end,
  endInset,
  testID,
}: InputFieldProps) {
  return (
    <FieldFrame
      testID={`${testID}-field`}
      invalid={invalid}
      {...(icon && { icon })}
      {...(endInset !== undefined && { endInset })}
    >
      <TextField
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTone="supporting"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect ?? keyboardType === "default"}
        {...(returnKeyType && { returnKeyType })}
        {...(textContentType && { textContentType })}
        {...(maxLength !== undefined && { maxLength })}
        {...(onSubmit && { onSubmitEditing: onSubmit })}
        style={styles.input}
      />
      {end}
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  // Room above and below its words, so a field grown by large text keeps its breathing room.
  input: { flex: 1, paddingVertical: space[12] },
});
