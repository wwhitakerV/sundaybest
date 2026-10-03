import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { ClipboardPaste, Link2 } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { TextField } from "@/ui/typography/TextField";
import { FIELD_EDGE, FIELD_ICON, FIELD_ICON_INSET } from "./field-geometry";

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
        <Link2
          size={FIELD_ICON}
          color={theme.colors.textMuted}
          strokeWidth={theme.icon.strokeWidth}
        />
        <TextField
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={Keyboard.dismiss}
          placeholder="Sermon link"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          textContentType="URL"
          accessibilityLabel="Sermon link"
          style={styles.input}
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
          <SFProLabel tone="onControlPrimary">Paste</SFProLabel>
        </Pressable>
      </View>
      {error && (
        <MonoBody
          variant="supporting"
          tone="accent"
          style={styles.error}
          testID={`${testID}-error`}
          accessibilityLiveRegion="polite"
        >
          {error}
        </MonoBody>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[8] },
  field: {
    minHeight: 64,
    borderWidth: FIELD_EDGE,
    borderRadius: radius[32],
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: FIELD_ICON_INSET,
    paddingRight: space[8],
    gap: space[12],
  },
  paste: {
    height: 48,
    borderRadius: radius[24],
    flexDirection: "row",
    alignItems: "center",
    gap: space[8],
    paddingHorizontal: space[18],
  },
  input: { flex: 1, paddingVertical: space[16] },
  error: { marginLeft: space[20] },
});
