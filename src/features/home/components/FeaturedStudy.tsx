import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Link, type Href } from "expo-router";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import type { RefObject } from "react";

import { radius, space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

/** The sermon's artwork: its corners softened, never a card round it. */
const ARTWORK_RADIUS = radius[16];

type AnimatedViewStyle = StyleProp<AnimatedStyle<ViewStyle>>;

export type FeaturedStudyProps = {
  study: {
    title: string;
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
 * The study under way, featured on Home as a publication would: the
 * sermon's 16:9 artwork alone on the white page — no backdrop, wash or
 * overlay — then a restrained label with where it stands opposite, the plan's
 * title large in Canela, today's study and its minutes quietly in Söhne, and
 * Continue, black and full width, under it all. The artwork opens the plan,
 * zooming into it (`Link.AppleZoom`). As Home scrolls (`useStudyScroll`) the
 * artwork is held back a little, and the words and Continue collapse up into
 * the bar, fading.
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
    <View testID="home-featured-study" style={styles.study}>
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
                  <VideoThumbnail uri={study.thumbnailUrl} style={styles.artwork} />
                </View>
              </Animated.View>
            </View>
          </Link.AppleZoom>
        </Pressable>
      </Link>

      <Animated.View style={wordsStyle}>
        <View ref={wordsRef} collapsable={false} onLayout={onWordsLayout} style={styles.words}>
          <View style={styles.labels}>
            <MonoLabel variant="labelTracked" tone="textSupporting">
              {study.label}
            </MonoLabel>
            <MonoLabel variant="labelTracked" tone="textSupporting" testID="home-featured-day">
              {study.dayOfTotal}
            </MonoLabel>
          </View>
          <SerifTitle variant="feature" accessibilityRole="header" testID="home-featured-title">
            {study.title}
          </SerifTitle>
          <SFProBody variant="rowDetail" tone="textSupporting" testID="home-featured-today">
            {study.today}
          </SFProBody>
        </View>
      </Animated.View>

      <Animated.View style={continueStyle}>
        <View ref={continueRef} collapsable={false} onLayout={onContinueLayout}>
          <Button
            testID="home-tab-continue-button"
            label={study.action}
            variant={study.waiting ? "waiting" : "primary"}
            onPress={onContinue}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  study: { gap: space[24] },
  zoomSource: { borderRadius: ARTWORK_RADIUS },
  // Grown from its foot: pulled down, it reaches up into the room above it.
  lift: { transformOrigin: "bottom" },
  artwork: { width: "100%", aspectRatio: 16 / 9, borderRadius: ARTWORK_RADIUS },
  words: { gap: space[12] },
  labels: { flexDirection: "row", justifyContent: "space-between", gap: space[12] },
});
