import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Link, type Href } from "expo-router";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import type { RefObject } from "react";

import { PlanFeature } from "@/entities/plan";
import { radius } from "@/theme";

/** The artwork's corners, which its zoom grows from. */
const ARTWORK_RADIUS = radius[16];

type AnimatedViewStyle = StyleProp<AnimatedStyle<ViewStyle>>;

export type FeaturedStudyProps = {
  study: {
    title: string;
    /** The sermon's church, under the title — none when the sermon doesn't say. */
    church: string | null;
    thumbnailUrl: string | null;
    /** The label over the title, naming the study under way ("IN PROGRESS"). */
    label: string;
    /** Where it stands, opposite the label ("DAY 2 OF 7"). */
    dayOfTotal: string;
    /** Today's study and how long it takes ("Today: Clothed With Power · 9 min"). */
    today: string;
    /** The way on: "Continue Day 2", or "Day 3 tomorrow" while it waits. */
    action: string;
    waiting: boolean;
  };
  /** The plan, opened from its artwork — which zooms into it. */
  href: Href;
  onContinue: () => void;
  /** Its artwork and its words: each measured where it sits, and moved with the scroll (`useStudyScroll`). */
  artworkRef: RefObject<View | null>;
  onArtworkLayout: () => void;
  artworkStyle: AnimatedViewStyle;
  wordsRef: RefObject<View | null>;
  onWordsLayout: () => void;
  wordsStyle: AnimatedViewStyle;
  continueRef: RefObject<View | null>;
  onContinueLayout: () => void;
  continueStyle: AnimatedViewStyle;
};

/**
 * The study under way, featured on Home (`PlanFeature`, as each of Plans'
 * pages is). The artwork opens the plan, zooming into it (`Link.AppleZoom`).
 * As Home scrolls (`useStudyScroll`) the artwork is held back a little, and
 * the words and Continue collapse up into the bar, fading.
 */
export function FeaturedStudy({
  study,
  href,
  onContinue,
  artworkRef,
  onArtworkLayout,
  artworkStyle,
  wordsRef,
  onWordsLayout,
  wordsStyle,
  continueRef,
  onContinueLayout,
  continueStyle,
}: FeaturedStudyProps) {
  return (
    <PlanFeature
      plan={{ ...study, standing: study.dayOfTotal }}
      onContinue={onContinue}
      frameArtwork={(artwork) => (
        <Link href={href} asChild>
          <Pressable
            testID="home-tab-active-plan"
            accessibilityRole="button"
            accessibilityLabel={`${study.title}, ${study.dayOfTotal.toLowerCase()}`}
            accessibilityHint="Opens the plan"
          >
            <Link.AppleZoom>
              <View collapsable={false} style={styles.zoomSource}>
                {/* Held back as it scrolls, grown from its foot when pulled down, hidden while it flies. */}
                <Animated.View style={[styles.lift, artworkStyle]}>
                  <View ref={artworkRef} collapsable={false} onLayout={onArtworkLayout}>
                    {artwork}
                  </View>
                </Animated.View>
              </View>
            </Link.AppleZoom>
          </Pressable>
        </Link>
      )}
      words={{ ref: wordsRef, onLayout: onWordsLayout, style: wordsStyle }}
      action={{ ref: continueRef, onLayout: onContinueLayout, style: continueStyle }}
      testIDs={{
        root: "home-featured-study",
        title: "home-featured-title",
        standing: "home-featured-day",
        today: "home-featured-today",
        action: "home-tab-continue-button",
      }}
    />
  );
}

const styles = StyleSheet.create({
  zoomSource: { borderRadius: ARTWORK_RADIUS },
  // Grown from its foot: pulled down, it reaches up into the room above it.
  lift: { transformOrigin: "bottom" },
});
