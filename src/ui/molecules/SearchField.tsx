import { Pressable, StyleSheet } from "react-native";
import { CircleX, Search } from "lucide-react-native";

import { controlHeight, space, useTheme } from "@/theme";
import { FieldFrame } from "@/ui/atoms/FieldFrame";
import { TextField } from "@/ui/typography/TextField";

/** The clear: iOS's, small and filled. */
const CLEAR = 19;

export type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** What it searches, for VoiceOver ("Search your plans"). */
  accessibilityLabel: string;
  /** Open with the keyboard up: a search the reader came to type in. */
  autoFocus?: boolean;
  /** On the keyboard's Search key. */
  onSubmit?: () => void;
  /** The field let go — the keyboard put away. */
  onBlur?: () => void;
  /** Its clear, where clearing does more than empty the field (New Plan drops its results too). */
  onClear?: () => void;
  /** Floating over the keyboard: white, lifted by a soft shadow — beside a `raised` close. */
  raised?: boolean;
  /** The input's; its frame is `${testID}-field`, its clear `${testID}-clear`. */
  testID: string;
};

/**
 * A search field: the shared field frame with a magnifier, its placeholder in
 * the supporting grey, and a small grey-filled clear once something's typed.
 * `raised`, it floats white on a soft shadow.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  accessibilityLabel,
  autoFocus = false,
  onSubmit,
  onBlur,
  onClear,
  raised = false,
  testID,
}: SearchFieldProps) {
  const theme = useTheme();

  return (
    <FieldFrame
      testID={`${testID}-field`}
      icon={Search}
      raised={raised}
      // Raised (the search on the keyboard), the clear sits closer to the end.
      endInset={raised ? space[14] : space[16]}
    >
      <TextField
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTone="supporting"
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        {...(onSubmit && { onSubmitEditing: onSubmit })}
        {...(onBlur && { onBlur })}
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable
          testID={`${testID}-clear`}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={(controlHeight.hitTarget - CLEAR) / 2}
          onPress={onClear ?? (() => onChange(""))}
        >
          {/* A grey disc with the X cut out of it in the field's own colour. */}
          <CircleX
            size={CLEAR}
            fill={theme.colors.textMuted}
            color={raised ? theme.colors.background : theme.colors.surface}
            strokeWidth={theme.icon.strokeWidth}
          />
        </Pressable>
      )}
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  // Room above and below its words, so a field grown by large text keeps its breathing room.
  input: { flex: 1, paddingVertical: space[12] },
});
