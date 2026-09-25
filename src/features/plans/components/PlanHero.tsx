import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Link } from "expo-router";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { BookOpen } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { PAGE_INSET } from "@/ui/Screen";
import { StepProgress } from "@/ui/StepProgress";
import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import { prefersLightInk } from "@/utils/color/prefersLightInk";
import { getPlanCoverFade, type PlanArtworkFrame } from "../logic/plan-artwork";
import type { PlanHeroWords } from "../logic/plan-hero";

/** As Home's hero's artwork. */
const ARTWORK_RADIUS = 20;
/** From the artwork's bottom edge to the words. */
const WORDS_GAP = 28;
const HALO_RADIUS = 12;
/** How much of the artwork, from its bottom up, the colour over it starts coming in across. */
const COVER_LIFT = 1 / 8;
/** The sermon's still, washed faintly over the whole hero, behind everything. */
const UNDERLAY_OPACITY = 0.2;

type AnimatedViewStyle = StyleProp<AnimatedStyle<ViewStyle>>;

export type PlanHeroProps = {
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  /** The sermon's colours, strongest first; empty until known. */
  colors: readonly string[];
  words: PlanHeroWords;
  totalDays: number;
  completedDayCount: number;
  /** Where the artwork sits in the hero (`getPlanArtworkFrame`). */
  artwork: PlanArtworkFrame;
  /** Holds the artwork back as the page scrolls, so it rises at half the rate. */
  artworkStyle?: AnimatedViewStyle;
  /** Continue, fading as it hands over to the tab bar and back. */
  continueStyle?: AnimatedViewStyle;
  /** Whether Continue's here to press — not while it's handed over. */
  continueShown: boolean;
  /** Reports where Continue sits down the hero. */
  onContinueLayout: (event: LayoutChangeEvent) => void;
  onContinue: () => void;
};

/**
 * Plan Detail's hero, flush to the top of the screen (up behind the status
 * bar) in a gradient of the sermon's own colours with its still washed
 * faintly over it, edge to edge: the sermon's thumbnail
 * centred below the nav buttons, as on Home's hero; and under it where the
 * plan stands, its title and church, Continue, what the day holds, and the
 * day-by-day line. Its words are white on a dark colour and black on a
 * light one.
 *
 * As the page scrolls the artwork's held back, rising at half the rate,
 * while the words and the list move with the finger — sliding up over it on
 * the same gradient, which comes in from the artwork's bottom edge over
 * three quarters of the content, so the artwork dissolves under them. The artwork is the target of the zoom
 * from Home's plan.
 */
export function PlanHero({
  title,
  church,
  thumbnailUrl,
  colors,
  words,
  totalDays,
  completedDayCount,
  artwork,
  artworkStyle,
  continueStyle,
  continueShown,
  onContinueLayout,
  onContinue,
}: PlanHeroProps) {
  const theme = useTheme();
  const colour = colors.at(0) ?? theme.colors.featureBackdrop;
  const light = prefersLightInk(colour);
  const ink = light ? theme.colors.inkOnDark : theme.colors.inkOnLight;
  const muted = light ? theme.colors.inkOnDarkMuted : theme.colors.inkOnLightMuted;
  const halo = {
    textShadowColor: light ? theme.colors.inkHaloOnDark : theme.colors.inkHaloOnLight,
    textShadowRadius: HALO_RADIUS,
  };
  const stops = getBackdropStops(colors, theme.colors.featureBackdrop);
  const { top, left, width, height, bottom } = artwork;
  const [heroHeight, setHeroHeight] = useState(0);
  const fade = getPlanCoverFade({ artworkBottom: bottom, heroHeight });
  // Raised, whole, up over the artwork's lower part — so it's solid higher up the words.
  const lift = height * COVER_LIFT;
  const coverFade = fade && { from: fade.from - lift, to: fade.to - lift };
  const underlay = thumbnailUrl ? { uri: thumbnailUrl, opacity: UNDERLAY_OPACITY } : undefined;

  return (
    <View
      testID="plan-overview-hero"
      onLayout={(event) => setHeroHeight(event.nativeEvent.layout.height)}
      style={[styles.hero, { backgroundColor: colour }]}
    >
      <GradientBackdrop
        testID="plan-overview-hero-backdrop"
        stops={stops}
        {...(underlay && { underlay })}
      />

      <Animated.View style={[styles.artwork, { top, left, width, height }, artworkStyle]}>
        {/* Where Home's plan zooms into. Does nothing when there's no zoom. */}
        <Link.AppleZoomTarget>
          <View collapsable={false} style={styles.zoomTarget}>
            <VideoThumbnail
              testID="plan-overview-sermon"
              uri={thumbnailUrl}
              style={styles.thumbnail}
            />
          </View>
        </Link.AppleZoomTarget>
      </Animated.View>

      {/* The same gradient again, plain, over the artwork and the still washed
      beneath: clear down to the artwork's bottom edge at rest, coming in
      gradually down the words — so both dissolve into the colour below. */}
      {coverFade && (
        <GradientBackdrop testID="plan-overview-hero-cover" stops={stops} reveal={coverFade} />
      )}

      <View style={[styles.content, { paddingTop: bottom + WORDS_GAP }]}>
        <View style={styles.words}>
          <Text
            testID="plan-overview-status"
            style={[theme.typography.metaLabel, styles.status, halo, { color: muted }]}
          >
            {words.status}
          </Text>
          <Text
            testID="plan-overview-title"
            accessibilityRole="header"
            style={[theme.typography.headline, styles.centred, halo, { color: ink }]}
          >
            {title}
          </Text>
          {church && (
            <Text style={[theme.typography.body, styles.centred, halo, { color: muted }]}>
              {church}
            </Text>
          )}
        </View>

        <Animated.View
          onLayout={onContinueLayout}
          pointerEvents={continueShown ? "auto" : "none"}
          style={continueStyle}
        >
          <CompactButton
            testID="plan-overview-continue-button"
            label={words.action}
            icon={BookOpen}
            tone={light ? "light" : "dark"}
            onPress={onContinue}
          />
        </Animated.View>

        <Text style={[theme.typography.body, styles.centred, { color: muted }]}>{words.today}</Text>
        <View accessible accessibilityLabel={`${completedDayCount} of ${totalDays} days done`}>
          <StepProgress
            testID="plan-overview-progress"
            steps={totalDays}
            // Days are done in order, so the first not yet done is the active segment.
            activeIndex={completedDayCount}
            ink={light ? "light" : "dark"}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: "hidden" },
  artwork: { position: "absolute" },
  zoomTarget: { flex: 1, borderRadius: ARTWORK_RADIUS, overflow: "hidden" },
  thumbnail: { width: "100%", height: "100%", borderRadius: ARTWORK_RADIUS },
  content: { paddingHorizontal: PAGE_INSET, paddingBottom: 36, gap: 16 },
  words: { alignItems: "center", gap: 6, marginBottom: 4 },
  status: { letterSpacing: 1 },
  centred: { textAlign: "center" },
});
