import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { StepProgress } from "@/ui/StepProgress";
import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";

export type ActivePlanCardProps = {
  title: string;
  thumbnailUrl: string | null;
  currentDay: number;
  totalDays: number;
  completedDayCount: number;
  onOpen: () => void;
  onContinue: () => void;
};

/**
 * The plan under way, front and centre: its sermon, title, a segment per day
 * (done, today, still to come), which day it's on, and Continue.
 */
export function ActivePlanCard({
  title,
  thumbnailUrl,
  currentDay,
  totalDays,
  completedDayCount,
  onOpen,
  onContinue,
}: ActivePlanCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID="home-tab-active-plan"
      accessibilityRole="button"
      accessibilityLabel={`${title}, day ${currentDay} of ${totalDays}`}
      onPress={onOpen}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.divider,
          shadowColor: theme.colors.shadow,
        },
        theme.elevation.card,
      ]}
    >
      <VideoThumbnail uri={thumbnailUrl} style={styles.thumbnail} />
      <View style={styles.body}>
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>{title}</Text>
        <View accessible accessibilityLabel={`${completedDayCount} of ${totalDays} days done`}>
          <StepProgress
            testID="home-tab-active-plan-progress"
            steps={totalDays}
            // Days are done in order, so the first not yet done is the active segment.
            activeIndex={completedDayCount}
          />
        </View>
        <View style={styles.footer}>
          <Text
            testID="home-tab-active-plan-day"
            style={[theme.typography.body, { color: theme.colors.textMuted }]}
          >
            Day {currentDay} of {totalDays}
          </Text>
          <Pressable
            testID="home-tab-continue-button"
            accessibilityRole="button"
            accessibilityLabel={`Continue day ${currentDay}`}
            onPress={onContinue}
            hitSlop={12}
            style={styles.continue}
          >
            <Text style={[theme.typography.button, { color: theme.colors.text }]}>Continue</Text>
            <ChevronRight
              size={20}
              color={theme.colors.text}
              strokeWidth={theme.icon.strokeWidth}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 32, overflow: "hidden" },
  thumbnail: { width: "100%" },
  body: { padding: 24, gap: 16 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  continue: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 },
});
