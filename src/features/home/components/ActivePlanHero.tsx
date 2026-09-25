import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { Link, type Href } from "expo-router";
import { BookOpen } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { PAGE_INSET } from "@/ui/Screen";
import { StepProgress } from "@/ui/StepProgress";
import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import { prefersLightInk } from "@/utils/color/prefersLightInk";
import type { ActivePlanWords } from "../logic/active-plan-hero";
import {
  HERO_ARTWORK_RADIUS,
  HERO_ARTWORK_WIDTH_RATIO,
  HERO_BREATHE_BOTTOM,
  HERO_BREATHE_TOP,
  HERO_RADIUS,
} from "../logic/hero-collapse";

export type ActivePlanHeroProps = {
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  /** The sermon's colours, from its thumbnail, strongest first; empty until known. */
  colors: readonly string[];
  words: ActivePlanWords;
  currentDay: number;
  totalDays: number;
  completedDayCount: number;
  /** Plan Detail for this plan, in the same stack — the artwork zooms into it. */
  href: Href;
  onContinue: () => void;
  /**
   * Its coloured frame as it scrolls: corners straightening as it nears the
   * top of the phone, then held there and shortening as it collapses.
   */
  frameStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** The room it keeps in the page — its full height, once measured — so the list never jumps as it collapses. */
  slotHeight?: number | undefined;
  /** Reports its content's height, from which its full height is known. */
  onContentLayout?: (event: LayoutChangeEvent) => void;
  /** Its content as it collapses into the plan bar — it gives way. */
  contentStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** Its artwork — hidden while a copy flies it up into the plan bar. */
  artworkStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
};

/**
 * The plan under way, featured at the top of Home the way Apple presents a
 * show: the full width in a gradient of its sermon's own colours, with room
 * to breathe (rounded at the top, just under the header) — its thumbnail
 * centred, a quiet status line, the title and church, a compact call to
 * continue, and what today holds, over the day-by-day line. Its type is
 * white on a dark colour and black on a light one.
 *
 * The artwork opens Plan Detail — on iOS 18+ it's the source of the system's
 * zoom transition (`Link.AppleZoom`), shrinking back into place on the way
 * out; earlier iOS gets a normal push. Continue goes straight to today's
 * study.
 */
export function ActivePlanHero({
  title,
  church,
  thumbnailUrl,
  colors,
  words,
  currentDay,
  totalDays,
  completedDayCount,
  href,
  onContinue,
  frameStyle,
  slotHeight,
  onContentLayout,
  contentStyle,
  artworkStyle,
}: ActivePlanHeroProps) {
  const theme = useTheme();
  const colour = colors.at(0) ?? theme.colors.featureBackdrop;
  const light = prefersLightInk(colour);
  const ink = light ? theme.colors.inkOnDark : theme.colors.inkOnLight;
  const muted = light ? theme.colors.inkOnDarkMuted : theme.colors.inkOnLightMuted;

  return (
    // The slot keeps the hero's full height in the page; the frame inside
    // is what's held at the top and shortened as it collapses.
    <View style={[styles.slot, slotHeight !== undefined && { height: slotHeight }]}>
      <Animated.View
        testID="home-tab-active-hero"
        style={[styles.hero, { backgroundColor: colour }, frameStyle]}
      >
        <GradientBackdrop
          testID="home-tab-active-hero-backdrop"
          stops={getBackdropStops(colors, theme.colors.featureBackdrop)}
        />
        <Animated.View onLayout={onContentLayout} style={[styles.content, contentStyle]}>
          <Link href={href} asChild>
            <Pressable
              testID="home-tab-active-plan"
              accessibilityRole="button"
              accessibilityLabel={`${title}, day ${currentDay} of ${totalDays}. ${completedDayCount} of ${totalDays} days done.`}
              accessibilityHint="Opens the plan"
              style={styles.artworkButton}
            >
              <Link.AppleZoom>
                {/* The zoom's source: shape only — the artwork's corners — so iOS
                can take over its radius mid-transition without the artwork
                losing its own. A single style object, as Link.AppleZoom's
                Slot requires. */}
                <View collapsable={false} style={styles.zoomSource}>
                  <Animated.View style={artworkStyle}>
                    <VideoThumbnail uri={thumbnailUrl} style={styles.artwork} />
                  </Animated.View>
                </View>
              </Link.AppleZoom>
            </Pressable>
          </Link>

          <View style={styles.words}>
            <Text
              testID="home-tab-active-plan-status"
              style={[theme.typography.metaLabel, styles.status, { color: muted }]}
            >
              {words.status}
            </Text>
            <Text style={[theme.typography.headline, styles.centred, { color: ink }]}>{title}</Text>
            {church && (
              <Text style={[theme.typography.body, styles.centred, { color: muted }]}>
                {church}
              </Text>
            )}
          </View>

          <CompactButton
            testID="home-tab-continue-button"
            label={words.action}
            icon={BookOpen}
            tone={light ? "light" : "dark"}
            onPress={onContinue}
          />

          <Text
            testID="home-tab-active-plan-today"
            style={[theme.typography.body, styles.centred, { color: muted }]}
          >
            {words.today}
          </Text>
          <StepProgress
            testID="home-tab-active-plan-progress"
            steps={totalDays}
            // Days are done in order, so the first not yet done is the active segment.
            activeIndex={completedDayCount}
            ink={light ? "light" : "dark"}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full width — past the page inset — and over the list, which scrolls
  // under it once it's pinned at the top.
  slot: { marginHorizontal: -PAGE_INSET, zIndex: 1 },
  // Rounded only at the top.
  hero: {
    paddingHorizontal: PAGE_INSET,
    paddingTop: HERO_BREATHE_TOP,
    paddingBottom: HERO_BREATHE_BOTTOM,
    borderTopLeftRadius: HERO_RADIUS,
    borderTopRightRadius: HERO_RADIUS,
    overflow: "hidden",
  },
  // Never squeezed as the frame shortens around it: it keeps its full size,
  // clipped, so its measured height is always the hero's real one.
  content: { gap: 16, flexShrink: 0 },
  artworkButton: { alignSelf: "center", width: `${HERO_ARTWORK_WIDTH_RATIO * 100}%` },
  zoomSource: { borderRadius: HERO_ARTWORK_RADIUS },
  artwork: { borderRadius: HERO_ARTWORK_RADIUS },
  // A little more room after the artwork, and before the call to action.
  words: { alignItems: "center", gap: 6, marginTop: 8, marginBottom: 4 },
  status: { letterSpacing: 1 },
  centred: { textAlign: "center" },
});
