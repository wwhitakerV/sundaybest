import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export type StatCardProps = {
  value: string;
  label: string;
  testID: string;
};

/** One total on Progress: the number, large, over what it counts. */
export function StatCard({ value, label, testID }: StatCardProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <Text style={[theme.typography.display, { color: theme.colors.text }]}>{value}</Text>
      <Text numberOfLines={1} style={[theme.typography.body, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderWidth: 1, borderRadius: 28, padding: 18, gap: 6 },
});
