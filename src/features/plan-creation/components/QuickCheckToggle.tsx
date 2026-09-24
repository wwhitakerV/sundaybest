import { StyleSheet, Switch, Text, View } from "react-native";
import { ListChecks } from "lucide-react-native";

import { useTheme } from "@/theme";

export type QuickCheckToggleProps = {
  value: boolean;
  onChange: (enabled: boolean) => void;
  testID: string;
};

/** "Add a quick check quiz", on or off. */
export function QuickCheckToggle({ value, onChange, testID }: QuickCheckToggleProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <ListChecks size={22} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
      <Text style={[theme.typography.listItem, styles.label, { color: theme.colors.text }]}>
        Add a quick check quiz
      </Text>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onChange}
        accessibilityLabel="Add a quick check quiz"
        trackColor={{ true: theme.colors.controlPrimary, false: theme.colors.divider }}
        ios_backgroundColor={theme.colors.divider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  label: { flex: 1 },
});
