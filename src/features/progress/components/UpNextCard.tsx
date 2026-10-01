import { Pressable, StyleSheet, View } from "react-native";
import { BookOpen, ChevronRight, CircleCheck } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";

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
          <SFProBody variant="listItem" numberOfLines={1}>
            {title}
          </SFProBody>
          <SFProBody tone="textMuted">{`Day ${dayNumber}, ${minutes} min`}</SFProBody>
        </View>
        <View style={styles.percent}>
          <CircleCheck size={20} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
          <SFProBody variant="listItem">{`${percent}%`}</SFProBody>
        </View>
      </View>
      <View style={styles.bottom}>
        {reminderTime ? (
          <View
            style={[
              styles.time,
              { backgroundColor: theme.colors.segmentBackground, borderRadius: radius.pill },
            ]}
          >
            <SFProBody variant="listItem">{reminderTime}</SFProBody>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.day}>
          <SFProBody variant="listItem">{`Day ${dayNumber}`}</SFProBody>
          <ChevronRight size={20} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: radius[36], padding: space[20], gap: space[20] },
  top: { flexDirection: "row", alignItems: "center", gap: space[16] },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: { flex: 1, gap: space[2] },
  percent: { flexDirection: "row", alignItems: "center", gap: space[8] },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  time: { paddingHorizontal: space[16], paddingVertical: space[8] },
  day: { flexDirection: "row", alignItems: "center", gap: space[4] },
});
