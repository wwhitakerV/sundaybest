import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { Link, type Href } from "expo-router";

import {
  getHeroPalette,
  HERO_WORDS_GAP,
  HeroBackdrop,
  HeroContent,
  HeroContentFade,
  type HeroPlan,
} from "@/entities/plan";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { useTheme } from "@/theme";
import {
  HERO_ARTWORK_RADIUS,
  HERO_ARTWORK_WIDTH_RATIO,
  HERO_BREATHE_BOTTOM,
  HERO_BREATHE_TOP,
  HERO_RADIUS,
} from "../logic/hero-collapse";

type AnimatedViewStyle = StyleProp<AnimatedStyle<ViewStyle>>;

/** How the hero collapses as Home scrolls (`useHeroCollapse`). */
type ActivePlanHeroMotion = {
  /**
   * Its coloured frame as it scrolls: corners straightening as it nears the
   * top of the phone, then held there and shortening as it collapses.
   */
  frameStyle?: AnimatedViewStyle;
  /** Its content as it collapses into the plan bar — it gives way. */
  contentStyle?: AnimatedViewStyle;
  /** Its artwork — hidden while a copy flies it up into the plan bar. */
  artworkStyle?: AnimatedViewStyle;
  /** The room it keeps in the page — its full height, once measured — so the list never jumps as it collapses. */
  slotHeight?: number | undefined;
  /** Reports its content's height, from which its full height is known. */
  onContentLayout?: (event: LayoutChangeEvent) => void;
};

export type ActivePlanHeroProps = {
  plan: HeroPlan & {
    thumbnailUrl: string | null;
    /** The sermon's colours, from its thumbnail, strongest first; empty until known. */
    colors: readonly string[];
    currentDay: number;
  };
  /** Plan Detail for this plan, in the same stack — the artwork zooms into it. */
  href: Href;
  onContinue: () => void;
  motion?: ActivePlanHeroMotion;
};

/**
 * The plan under way, featured at the top of Home the way Apple presents a
 * show: the full width in a gradient of its sermon's own colours with its
 * still washed faintly over it, with room to breathe (rounded at the top,
 * just under the header) — its thumbnail centred, and under it the hero's
 * words (`HeroContent`) on their own colour (`HeroContentFade`), exactly as
 * on Plan Detail.
 *
 * The artwork opens Plan Detail — on iOS 18+ it's the source of the system's
 * zoom transition (`Link.AppleZoom`), shrinking back into place on the way
 * out; earlier iOS gets a normal push. Continue goes straight to today's
 * study.
 */
export function ActivePlanHero({ plan, href, onContinue, motion = {} }: ActivePlanHeroProps) {
  const theme = useTheme();
  const { title, thumbnailUrl, colors, currentDay, totalDays, completedDayCount } = plan;
  const { frameStyle, contentStyle, artworkStyle, slotHeight, onContentLayout } = motion;
  const { colour, stops, light } = getHeroPalette(colors, theme.colors.featureBackdrop);
  // Where the artwork sits in the content, for the words' colour to come in over.
  const [artwork, setArtwork] = useState({ y: 0, height: 0 });

  return (
    // The slot keeps the hero's full height in the page; the frame inside
    // is what's held at the top and shortened as it collapses.
    <View style={[styles.slot, slotHeight !== undefined && { height: slotHeight }]}>
      <Animated.View
        testID="home-tab-active-hero"
        style={[styles.hero, { backgroundColor: colour }, frameStyle]}
      >
        <HeroBackdrop
          testID="home-tab-active-hero-backdrop"
          colors={colors}
          thumbnailUrl={thumbnailUrl}
        />
        <Animated.View onLayout={onContentLayout} style={[styles.content, contentStyle]}>
          <Link href={href} asChild>
            <Pressable
              testID="home-tab-active-plan"
              accessibilityRole="button"
              accessibilityLabel={`${title}, day ${currentDay} of ${totalDays}. ${completedDayCount} of ${totalDays} days done.`}
              accessibilityHint="Opens the plan"
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                setArtwork({ y, height });
              }}
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

          {/* Over the artwork, under the words, across the whole hero: its
          top is the hero's, so the content's inset and breathing room back out. */}
          <HeroContentFade
            testID="home-tab-active-hero-content-fade"
            stops={stops}
            artworkBottom={HERO_BREATHE_TOP + artwork.y + artwork.height}
            artworkHeight={artwork.height}
            // Not before the artwork's measured, or it'd come in over it.
            heroHeight={artwork.height > 0 ? (slotHeight ?? 0) : 0}
            style={[styles.contentFade, { height: slotHeight }]}
          />

          <HeroContent
            plan={plan}
            light={light}
            onContinue={onContinue}
            testIDs={{
              content: "home-tab-active-plan-content",
              status: "home-tab-active-plan-status",
              continueButton: "home-tab-continue-button",
              today: "home-tab-active-plan-today",
              progress: "home-tab-active-plan-progress",
            }}
            style={styles.words}
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
  content: { flexShrink: 0 },
  artworkButton: { alignSelf: "center", width: `${HERO_ARTWORK_WIDTH_RATIO * 100}%` },
  zoomSource: { borderRadius: HERO_ARTWORK_RADIUS },
  artwork: { borderRadius: HERO_ARTWORK_RADIUS },
  contentFade: { top: -HERO_BREATHE_TOP, left: -PAGE_INSET, right: -PAGE_INSET },
  words: { marginTop: HERO_WORDS_GAP },
});
