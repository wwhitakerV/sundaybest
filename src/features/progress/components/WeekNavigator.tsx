import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { useTheme } from "@/theme";

const HIT = 44;

export type WeekNavigatorProps = {
  /** The title's two parts: "September" and, quieter, "20–26". */
  lead: string;
  range: string;
  onPrevious: () => void;
  onNext: () => void;
};

/** "‹ September 20–26 ›": the week being shown, and a step either way. */
export function WeekNavigator({ lead, range, onPrevious, onNext }: WeekNavigatorProps) {
  const theme = useTheme();
  const arrow = { size: 22, color: theme.colors.text, strokeWidth: theme.icon.strokeWidth };

  return (
    <View style={styles.row}>
      <Pressable
        testID="progress-week-previous"
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        onPress={onPrevious}
        style={styles.arrow}
      >
        <ChevronLeft {...arrow} />
      </Pressable>
      <Text
        testID="progress-week-title"
        style={[theme.typography.screenTitle, { color: theme.colors.text }]}
      >
        {`${lead} `}
        <Text style={{ color: theme.colors.textMuted }}>{range}</Text>
      </Text>
      <Pressable
        testID="progress-week-next"
        accessibilityRole="button"
        accessibilityLabel="Next week"
        onPress={onNext}
        style={styles.arrow}
      >
        <ChevronRight {...arrow} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 },
  arrow: { width: HIT, height: HIT, alignItems: "center", justifyContent: "center" },
});
