import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

const PLACEHOLDER_OPTIONS = ["A", "B", "C"] as const;

export type QuickCheckOptionsProps = {
  /** Each option's testID is `${testIDPrefix}-option-${option}`. */
  testIDPrefix: string;
};

/** The placeholder A/B/C answer choices shared by the Quick Check questions. */
export function QuickCheckOptions({ testIDPrefix }: QuickCheckOptionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.options}>
      {PLACEHOLDER_OPTIONS.map((option) => (
        <Pressable
          key={option}
          testID={`${testIDPrefix}-option-${option}`}
          accessibilityRole="button"
          style={[styles.option, { borderColor: theme.colors.divider }]}
        >
          <Text style={[theme.typography.body, { color: theme.colors.text }]}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: 8 },
  option: { padding: 12, borderWidth: 1, borderRadius: 8 },
});
