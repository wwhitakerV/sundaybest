import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, ChevronRight, CircleCheck } from "lucide-react-native";

import { useTheme } from "@/theme";

const BADGE = 60;

export type UpNextCardProps = {
  title: string;
  dayNumber: number;
  minutes: number;
  /** How far through the plan, 0–100 — from the store. */
  percent: number;
  /** The daily reminder, as a clock shows it — if one's set. */
  reminderTime: string | null;
  onPress: () => void;
};

/**
 * The plan under way, on Progress: its title, the day up next and about how
 * long it takes, how far through the plan is, and when the reminder comes.
 * Opens the plan.
 */
export function UpNextCard({
  title,
  dayNumber,
  minutes,
  percent,
  reminderTime,
  onPress,
}: UpNextCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID="progress-active-plan"
      accessibilityRole="button"
      accessibilityHint="Opens the plan"
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.text },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.badge, { backgroundColor: theme.colors.controlPrimary }]}>
          <BookOpen
            size={26}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
        <View style={styles.titles}>
          <Text numberOfLines={1} style={[theme.typography.listItem, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            {`Day ${dayNumber}, ${minutes} min`}
          </Text>
        </View>
        <View style={styles.percent}>
          <CircleCheck size={20} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
          <Text
            style={[theme.typography.listItem, { color: theme.colors.text }]}
          >{`${percent}%`}</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        {reminderTime ? (
          <View
            style={[
              styles.time,
              { backgroundColor: theme.colors.segmentBackground, borderRadius: theme.radii.pill },
            ]}
          >
            <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
              {reminderTime}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.day}>
          <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
            {`Day ${dayNumber}`}
          </Text>
          <ChevronRight size={20} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 36, padding: 20, gap: 20 },
  top: { flexDirection: "row", alignItems: "center", gap: 16 },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: { flex: 1, gap: 2 },
  percent: { flexDirection: "row", alignItems: "center", gap: 8 },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  time: { paddingHorizontal: 16, paddingVertical: 8 },
  day: { flexDirection: "row", alignItems: "center", gap: 4 },
});
