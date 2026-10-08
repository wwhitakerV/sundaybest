import { StyleSheet, TextInput, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";

export type SettingsFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID: string;
  keyboardType?: "default" | "email-address" | "url";
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words";
};

/** One Settings form field, using the same soft surface and edge as the rest of the app. */
export function SettingsFormField({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  keyboardType = "default",
  multiline = false,
  maxLength,
  autoCapitalize = "sentences",
}: SettingsFormFieldProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: space[8] }}>
      <SFProBody variant="label" tone="textMuted">
        {label}
      </SFProBody>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          theme.typography.body,
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.containerBorder,
            borderRadius: radius[16],
            paddingHorizontal: space[16],
            paddingVertical: multiline ? space[16] : 0,
          },
        ]}
      />
      {maxLength !== undefined && multiline ? (
        <SFProBody variant="detail" tone="textMuted" style={styles.counter}>
          {`${value.length}/${maxLength}`}
        </SFProBody>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 56, borderWidth: 1 },
  multiline: { minHeight: 140 },
  counter: { textAlign: "right" },
});
