import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export type ModeOptionProps = {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
};

/** A mode to start in — its name and what it means — picked like a radio button. */
export function ModeOption({ title, description, selected, onPress, testID }: ModeOptionProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={[
        styles.option,
        {
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radii.lg,
          borderColor: selected ? theme.colors.text : theme.colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            borderColor: selected ? theme.colors.accent : theme.colors.border,
            backgroundColor: selected ? theme.colors.accent : "transparent",
          },
        ]}
      />
      <View style={[styles.words, { gap: theme.spacing.xs }]}>
        <Text style={[theme.typography.stepTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[theme.typography.cardDetail, { color: theme.colors.textInactive }]}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const DOT = 20;

const styles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "flex-start" },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 1.5, marginTop: 2 },
  words: { flex: 1 },
});
