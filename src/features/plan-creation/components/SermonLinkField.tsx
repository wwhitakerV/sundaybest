import { Keyboard, Pressable, StyleSheet } from "react-native";
import { ClipboardPaste, Link2 } from "lucide-react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";
import { InputField } from "@/ui/molecules/InputField";
import { SFProLabel } from "@/ui/typography/SFProLabel";

/** Paste, inside the 52pt field: 6pt clear of its edge all round. */
const PASTE_HEIGHT = 40;

export type SermonLinkFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Fills the field from the clipboard. */
  onPaste: () => void;
  /** The link can't be used: its edge goes amber (the screen says why). */
  invalid: boolean;
  testID: string;
};

/** Where the sermon link goes: pasted with the Paste button, or typed. */
export function SermonLinkField({
  value,
  onChangeText,
  onPaste,
  invalid,
  testID,
}: SermonLinkFieldProps) {
  const theme = useTheme();

  return (
    <InputField
      testID={testID}
      icon={Link2}
      value={value}
      onChangeText={onChangeText}
      onSubmit={Keyboard.dismiss}
      placeholder="Sermon link"
      accessibilityLabel="Sermon link"
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="url"
      returnKeyType="done"
      textContentType="URL"
      invalid={invalid}
      endInset={(controlHeight.field - PASTE_HEIGHT) / 2}
      end={
        <Pressable
          testID={`${testID}-paste-button`}
          accessibilityRole="button"
          accessibilityLabel="Paste link"
          // A 44pt tap, though the pill is drawn smaller to sit inside the field.
          hitSlop={(controlHeight.hitTarget - PASTE_HEIGHT) / 2}
          onPress={onPaste}
          style={[styles.paste, { backgroundColor: theme.colors.controlPrimary }]}
        >
          <ClipboardPaste
            size={18}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
          <SFProLabel tone="onControlPrimary">Paste</SFProLabel>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  paste: {
    height: PASTE_HEIGHT,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: space[6],
    paddingHorizontal: space[16],
  },
});
