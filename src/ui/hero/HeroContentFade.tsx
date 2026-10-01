import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import type { BackdropStop } from "@/utils/color/getBackdropStops";
import { getHeroContentFade } from "@/utils/hero/getHeroContentFade";
import { GradientBackdrop } from "../atoms/GradientBackdrop";

export type HeroContentFadeProps = {
  /** The hero's own gradient (`getBackdropStops`), so it lies seamlessly over it. */
  stops: readonly BackdropStop[];
  /** Where the artwork's bottom edge is, down the hero. */
  artworkBottom: number;
  artworkHeight: number;
  /** The hero's full height; 0 until it's measured. */
  heroHeight: number;
  /** Its placement, when the hero's top isn't its parent's. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The colour behind a feature hero's words: the hero's gradient again,
 * clear an eighth of the way up the artwork and coming in down the words
 * (`getHeroContentFade`) — over the artwork, under the words. Lay it
 * between the two. Draws nothing until the hero's measured.
 */
export function HeroContentFade({
  stops,
  artworkBottom,
  artworkHeight,
  heroHeight,
  style,
  testID,
}: HeroContentFadeProps) {
  const reveal = getHeroContentFade({ artworkBottom, artworkHeight, heroHeight });
  if (!reveal) return null;

  return (
    <View
      {...(testID !== undefined && { testID: `${testID}-layer` })}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
    >
      <GradientBackdrop {...(testID !== undefined && { testID })} stops={stops} reveal={reveal} />
    </View>
  );
}
