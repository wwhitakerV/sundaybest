import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronRight } from "lucide-react-native";

import { useTheme } from "@/theme";

const ART_SIZE = 64;

export type PlanRowProps = {
  title: string;
  /** The line under the title: "Day 2 of 6", "Finished Sep 5", "Sample plan, 5 days". */
  detail: string;
  /** Finished plans end in a check; the rest in a chevron. */
  done: boolean;
  onPress: () => void;
  testID: string;
};

/** One plan in a list: its art, title, where it stands, and a way in. */
export function PlanRow({ title, detail, done, onPress, testID }: PlanRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}`}
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <View style={[styles.art, { backgroundColor: theme.colors.segmentBackground }]} />
      <View style={styles.text}>
        <Text numberOfLines={1} style={[theme.typography.listItem, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>{detail}</Text>
      </View>
      {done ? (
        <View style={[styles.done, { backgroundColor: theme.colors.controlPrimary }]}>
          <Check
            size={18}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
      ) : (
        <ChevronRight
          size={22}
          color={theme.colors.textMuted}
          strokeWidth={theme.icon.strokeWidth}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
    paddingRight: 20,
  },
  art: { width: ART_SIZE, height: ART_SIZE, borderRadius: 16 },
  text: { flex: 1, gap: 2 },
  done: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
