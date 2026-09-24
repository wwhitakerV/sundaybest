import { StyleSheet, Text, TextInput, View } from "react-native";
import { Link2 } from "lucide-react-native";

import { useTheme } from "@/theme";

export type SermonLinkFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Why the link can't be used, shown under the field; null when it's fine. */
  error: string | null;
  testID: string;
};

/** Where the sermon link goes: typed, or pasted with the system's own paste. */
export function SermonLinkField({ value, onChangeText, error, testID }: SermonLinkFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.accent : theme.colors.divider,
          },
        ]}
      >
        <Link2 size={22} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder="Sermon link"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          textContentType="URL"
          accessibilityLabel="Sermon link"
          style={[theme.typography.body, styles.input, { color: theme.colors.text }]}
        />
      </View>
      {error && (
        <Text
          testID={`${testID}-error`}
          accessibilityLiveRegion="polite"
          style={[theme.typography.supporting, styles.error, { color: theme.colors.accent }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  field: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  input: { flex: 1, paddingVertical: 16 },
  error: { marginLeft: 20 },
});
