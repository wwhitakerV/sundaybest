import { Pressable, StyleSheet, View } from "react-native";
import { CircleX, Search } from "lucide-react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";
import { TextField } from "@/ui/typography/TextField";

/** As tall as New plan's sermon search. */
export const SEARCH_FIELD_HEIGHT = 52;
const ICON = 20;
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
  /** Floating over the keyboard: white, lifted by a soft shadow — beside a `raised` close. */
  raised?: boolean;
  /** The field's; its clear is `${testID}-clear`. */
  testID: string;
};

/**
 * A search field, as New plan's sermon search: soft fill, a card's edge, a
 * magnifier and placeholder in the supporting grey, a small grey-filled clear. `raised`, it
 * floats white on a soft shadow.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  accessibilityLabel,
  autoFocus = false,
  onSubmit,
  onBlur,
  raised = false,
  testID,
}: SearchFieldProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.field,
        {
          backgroundColor: raised ? theme.colors.background : theme.colors.surface,
          // A card's edge, so the field holds against the page and the keyboard alike.
          borderColor: theme.colors.containerBorder,
          borderRadius: radius.pill,
          gap: space[10],
          paddingLeft: space[16],
          // Raised (the search on the keyboard), the clear sits closer to the end.
          paddingRight: raised ? space[14] : space[16],
        },
        raised && { shadowColor: theme.colors.shadow, ...theme.elevation.floating },
      ]}
    >
      <Search
        size={ICON}
        color={theme.colors.textSupporting}
        strokeWidth={theme.icon.strokeWidth}
      />
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
          onPress={() => onChange("")}
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
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: SEARCH_FIELD_HEIGHT,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1 },
});
