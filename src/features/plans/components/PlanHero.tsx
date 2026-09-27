import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Link } from "expo-router";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { HeroContent } from "@/ui/hero/HeroContent";
import { HeroContentFade } from "@/ui/hero/HeroContentFade";
import { HERO_BOTTOM_SPACE, HERO_WASH_OPACITY, HERO_WORDS_GAP } from "@/ui/hero/hero-layout";
import { PAGE_INSET } from "@/ui/Screen";
import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import { prefersLightInk } from "@/utils/color/prefersLightInk";
import type { PlanArtworkFrame } from "../logic/plan-artwork";
import type { PlanHeroWords } from "../logic/plan-hero";

/** As Home's hero's artwork. */
const ARTWORK_RADIUS = 20;

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
  /** The hero's height, once measured (0 until then), and how it's measured. */
  heroHeight: number;
  onHeroLayout: (event: LayoutChangeEvent) => void;
  /** The hero's colour zooming from its foot on a pull down, to keep reaching the top. */
  colourStyle?: AnimatedViewStyle;
};

/**
 * Plan Detail's hero, flush to the top of the screen (up behind the status
 * bar) in a gradient of the sermon's own colours with its still washed
 * faintly over it, edge to edge: the sermon's thumbnail centred below the
 * nav buttons, as on Home's hero; and under it the hero's words
 * (`HeroContent`) on their own colour (`HeroContentFade`) — the same as
 * Home's plan under way.
 *
 * As the page scrolls the artwork's held back, rising at half the rate,
 * while the words and the list move with the finger — sliding up over it on
 * their colour, so the artwork dissolves under them. Pulled down past the
 * top, the colour — gradient, wash, and the words' own, together — zooms
 * from its foot to keep reaching the top of the screen, so there's never
 * white above it: which is why only the artwork's clipped to the hero. The
 * artwork is the target of the zoom from Home's plan.
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
  heroHeight,
  onHeroLayout,
  colourStyle,
}: PlanHeroProps) {
  const theme = useTheme();
  const colour = colors.at(0) ?? theme.colors.featureBackdrop;
  const stops = getBackdropStops(colors, theme.colors.featureBackdrop);
  const { top, left, width, height, bottom } = artwork;
  const underlay = thumbnailUrl ? { uri: thumbnailUrl, opacity: HERO_WASH_OPACITY } : undefined;

  return (
    <View testID="plan-overview-hero" onLayout={onHeroLayout} style={{ backgroundColor: colour }}>
      <Animated.View
        testID="plan-overview-hero-colour"
        pointerEvents="none"
        style={[styles.colour, colourStyle]}
      >
        <GradientBackdrop
          testID="plan-overview-hero-backdrop"
          stops={stops}
          {...(underlay && { underlay })}
        />
      </Animated.View>

      <View
        testID="plan-overview-hero-artwork-clip"
        pointerEvents="box-none"
        style={styles.artworkClip}
      >
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
      </View>

      {/* Zoomed just as the colour beneath, so the two stay one. */}
      <Animated.View
        testID="plan-overview-hero-content-colour"
        pointerEvents="none"
        style={[styles.colour, colourStyle]}
      >
        <HeroContentFade
          testID="plan-overview-hero-cover"
          stops={stops}
          artworkBottom={bottom}
          artworkHeight={height}
          heroHeight={heroHeight}
        />
      </Animated.View>

      <HeroContent
        title={title}
        church={church}
        words={words}
        totalDays={totalDays}
        completedDayCount={completedDayCount}
        light={prefersLightInk(colour)}
        onContinue={onContinue}
        continueStyle={continueStyle}
        continueShown={continueShown}
        onContinueLayout={onContinueLayout}
        // The days below show how far through it is.
        showProgress={false}
        testIDs={{
          status: "plan-overview-status",
          title: "plan-overview-title",
          continueButton: "plan-overview-continue-button",
          progress: "plan-overview-progress",
        }}
        style={[styles.content, { paddingTop: bottom + HERO_WORDS_GAP }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Zoomed from its foot on a pull down (`colourStyle`); at rest, the hero exactly.
  colour: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    transformOrigin: "bottom",
  },
  artworkClip: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  artwork: { position: "absolute" },
  zoomTarget: { flex: 1, borderRadius: ARTWORK_RADIUS, overflow: "hidden" },
  thumbnail: { width: "100%", height: "100%", borderRadius: ARTWORK_RADIUS },
  content: { paddingHorizontal: PAGE_INSET, paddingBottom: HERO_BOTTOM_SPACE },
});
