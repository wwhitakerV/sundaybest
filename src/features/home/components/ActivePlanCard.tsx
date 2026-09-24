import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
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
  /** Plan Detail for this plan, in the same stack as the card. */
  href: Href;
};

/**
 * The plan under way, front and centre: its sermon, title, a segment per day
 * (done, today, still to come), which day it's on, and Continue.
 *
 * The whole card is one link to Plan Detail. On iOS 18+ the card is the
 * source of the system's zoom transition (`Link.AppleZoom`): it expands into
 * Plan Detail and shrinks back into place on the way out. Earlier iOS gets a
 * normal push. "Continue" is part of the card, not a second button.
 *
 * No shadow: iOS animates the zoom source itself, and a shadow on it is drawn
 * flat during the transition, then snaps back when it ends.
 */
export function ActivePlanCard({
  title,
  thumbnailUrl,
  currentDay,
  totalDays,
  completedDayCount,
  href,
}: ActivePlanCardProps) {
  const theme = useTheme();

  return (
    <Link href={href} asChild>
      <Pressable
        testID="home-tab-active-plan"
        accessibilityRole="button"
        accessibilityLabel={`${title}, day ${currentDay} of ${totalDays}. ${completedDayCount} of ${totalDays} days done.`}
        accessibilityHint="Opens the plan"
      >
        <Link.AppleZoom>
          {/* The zoom's source: a shape-only wrapper — the card's corners
              and nothing else (no background, border, or clipping). iOS
              reads its corner radius for the morph and takes it over during
              the transition; since nothing visible hangs off it, the card
              inside keeps its own rounded corners throughout. Its style is a
              single object, as Link.AppleZoom's Slot requires. */}
          <View collapsable={false} style={styles.zoomSource}>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
              ]}
            >
              <VideoThumbnail uri={thumbnailUrl} style={styles.thumbnail} />
              <View style={styles.body}>
                <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
                  {title}
                </Text>
                <StepProgress
                  testID="home-tab-active-plan-progress"
                  steps={totalDays}
                  // Days are done in order, so the first not yet done is the active segment.
                  activeIndex={completedDayCount}
                />
                <View style={styles.footer}>
                  <Text
                    testID="home-tab-active-plan-day"
                    style={[theme.typography.body, { color: theme.colors.textMuted }]}
                  >
                    Day {currentDay} of {totalDays}
                  </Text>
                  <View style={styles.continue}>
                    <Text style={[theme.typography.button, { color: theme.colors.text }]}>
                      Continue
                    </Text>
                    <ChevronRight
                      size={20}
                      color={theme.colors.text}
                      strokeWidth={theme.icon.strokeWidth}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Link.AppleZoom>
      </Pressable>
    </Link>
  );
}

const CARD_RADIUS = 32;
const CARD_BORDER = 1;

const styles = StyleSheet.create({
  zoomSource: { borderRadius: CARD_RADIUS },
  // No `overflow: hidden`: clipping the card fights iOS's own rounding as the
  // zoom lands, and the card visibly shakes. Nothing needs clipping except
  // the thumbnail's corners, which it rounds itself.
  card: { borderWidth: CARD_BORDER, borderRadius: CARD_RADIUS },
  // Its top corners follow the card's curve, just inside the border.
  thumbnail: {
    width: "100%",
    borderTopLeftRadius: CARD_RADIUS - CARD_BORDER,
    borderTopRightRadius: CARD_RADIUS - CARD_BORDER,
  },
  body: { padding: 24, gap: 16 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  continue: { flexDirection: "row", alignItems: "center", gap: 4 },
});
