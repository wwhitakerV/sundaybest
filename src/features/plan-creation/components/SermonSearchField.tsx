import { Pressable, StyleSheet, View } from "react-native";
import { Search, X } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { TextField } from "@/ui/typography/TextField";
import { FIELD_EDGE, FIELD_ICON, FIELD_ICON_INSET } from "./field-geometry";

export type SermonSearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  testID: string;
};

/** Search by the words a person is most likely to remember from a sermon. */
export function SermonSearchField({
  value,
  onChangeText,
  onSubmit,
  onClear,
  testID,
}: SermonSearchFieldProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.field,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <Search
        size={FIELD_ICON}
        color={theme.colors.textMuted}
        strokeWidth={theme.icon.strokeWidth}
      />
      <TextField
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Pastor, church, or sermon"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search sermons"
        style={styles.input}
        autoFocus
      />
      {value.length > 0 && (
        <Pressable
          testID={`${testID}-clear-button`}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={onClear}
          style={({ pressed }) => [
            styles.clear,
            {
              backgroundColor: theme.colors.segmentBackground,
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <X size={17} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 64,
    borderWidth: FIELD_EDGE,
    borderRadius: radius[32],
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: FIELD_ICON_INSET,
    paddingRight: space[12],
    gap: space[12],
  },
  input: { flex: 1, paddingVertical: space[16] },
  clear: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
