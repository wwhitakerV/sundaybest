import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { space } from "@/theme";
import { InputField } from "@/ui/molecules/InputField";
import { TextBox } from "@/ui/molecules/TextBox";
import { SFProBody } from "@/ui/typography/SFProBody";

/** A message box's least height: room for a few lines before it grows. */
const BOX_HEIGHT = 148;

export type SettingsFieldProps = {
  /** What it asks for: its name to VoiceOver. */
  label: string;
  /** What it says while empty. */
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  /** A quiet mark before a one-line field's words. */
  icon?: LucideIcon;
  keyboardType?: "default" | "email-address" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  /** A box for a message, several lines tall, with how much is left under it. */
  multiline?: boolean;
  maxLength?: number;
  testID: string;
};

/**
 * One of a Settings form's fields: a single line is the app's one-line field
 * (`InputField`), its quiet icon before the words; a message is a taller box,
 * with a count under it.
 */
export function SettingsField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  maxLength,
  testID,
}: SettingsFieldProps) {
  if (!multiline) {
    return (
      <InputField
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        {...(icon && { icon })}
        {...(maxLength !== undefined && { maxLength })}
      />
    );
  }
  return (
    <MessageBox
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize={autoCapitalize}
      {...(maxLength !== undefined && { maxLength })}
      testID={testID}
    />
  );
}

/** A box for a message, several lines tall, with how much is left under it. */
function MessageBox({
  label,
  placeholder,
  value,
  onChangeText,
  autoCapitalize,
  maxLength,
  testID,
}: Omit<SettingsFieldProps, "icon" | "keyboardType" | "multiline">) {
  return (
    <View style={{ gap: space[6] }}>
      <TextBox
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        minHeight={BOX_HEIGHT}
        {...(autoCapitalize && { autoCapitalize })}
        {...(maxLength !== undefined && { maxLength })}
      />
      {maxLength !== undefined && (
        <SFProBody variant="detail" tone="textMuted" style={styles.count}>
          {`${value.length}/${maxLength}`}
        </SFProBody>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  count: { textAlign: "right" },
});
