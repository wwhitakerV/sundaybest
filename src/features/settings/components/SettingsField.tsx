import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { TextField } from "@/ui/typography/TextField";

/** The field's edge, as New plan's sermon fields have it. */
const EDGE = 1;
const ICON = 20;
/** A one-line field's height: New plan's sermon link field's. */
const LINE_HEIGHT = 64;
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
 * One of a Settings form's fields, as New plan's sermon fields are: the
 * page's soft fill and a hairline edge, a quiet icon before a one-line
 * field's words, and a taller box, with a count under it, for a message.
 */
export function SettingsField({
  label,
  placeholder,
  value,
  onChangeText,
  icon: Icon,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  maxLength,
  testID,
}: SettingsFieldProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: space[6] }}>
      <View
        style={[
          multiline ? styles.box : styles.line,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.divider,
            borderRadius: multiline ? radius[24] : radius[32],
            gap: space[12],
            paddingHorizontal: space[20],
          },
          multiline && { paddingVertical: space[16] },
        ]}
      >
        {Icon && !multiline && (
          <Icon size={ICON} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
        )}
        <TextField
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={keyboardType === "default"}
          multiline={multiline}
          {...(maxLength !== undefined && { maxLength })}
          textAlignVertical={multiline ? "top" : "center"}
          style={styles.input}
        />
      </View>
      {multiline && maxLength !== undefined && (
        <SFProBody variant="detail" tone="textMuted" style={styles.count}>
          {`${value.length}/${maxLength}`}
        </SFProBody>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { minHeight: LINE_HEIGHT, borderWidth: EDGE, flexDirection: "row", alignItems: "center" },
  box: { minHeight: BOX_HEIGHT, borderWidth: EDGE },
  input: { flex: 1 },
  count: { textAlign: "right" },
});
