import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ClipboardPaste, Link2 } from "lucide-react-native";

import { useTheme } from "@/theme";

export type SermonLinkFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Fills the field from the clipboard. */
  onPaste: () => void;
  /** Why the link can't be used, shown under the field; null when it's fine. */
  error: string | null;
  testID: string;
};

/** Where the sermon link goes: pasted with the Paste button, or typed. */
export function SermonLinkField({
  value,
  onChangeText,
  onPaste,
  error,
  testID,
}: SermonLinkFieldProps) {
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
        <Pressable
          testID={`${testID}-paste-button`}
          accessibilityRole="button"
          accessibilityLabel="Paste link"
          onPress={onPaste}
          style={({ pressed }) => [
            styles.paste,
            { backgroundColor: theme.colors.controlPrimary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <ClipboardPaste
            size={20}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
          <Text style={[theme.typography.button, { color: theme.colors.onControlPrimary }]}>
            Paste
          </Text>
        </Pressable>
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
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  paste: {
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  input: { flex: 1, paddingVertical: 16 },
  error: { marginLeft: 20 },
});
