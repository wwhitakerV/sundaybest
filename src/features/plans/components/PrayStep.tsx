import { StyleSheet, Text, View } from "react-native";
import { HandHeart } from "lucide-react-native";

import type { Prayer } from "@/types/domain";
import { useTheme } from "@/theme";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";

const BADGE_SIZE = 52;

export type PrayStepProps = {
  dayNumber: number;
  prayer: Prayer;
  /** Brings the prayer in a beat after its title. */
  followStyle?: FollowStyle;
};

/** Daily Study's Pray step: the day's prayer. */
export function PrayStep({ dayNumber, prayer, followStyle }: PrayStepProps) {
  const theme = useTheme();

  return (
    <View testID="study-pray-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Pray" />
      <View style={styles.titleRow}>
        <View style={[styles.badge, { backgroundColor: theme.colors.controlPrimary }]}>
          <HandHeart
            size={24}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
        <Text style={[theme.typography.screenTitle, styles.title, { color: theme.colors.text }]}>
          {prayer.title}
        </Text>
      </View>
      <StudyFollow style={followStyle}>
        <Text style={[theme.typography.scripture, { color: theme.colors.text }]}>
          {prayer.text}
        </Text>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: { flexShrink: 1 },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
