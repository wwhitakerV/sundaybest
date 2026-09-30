import { useState } from "react";
import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { ArrowRight, Clock3 } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { Tag } from "@/ui/Tag";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import { getArtFrame, type ArtPlacement } from "../logic/art-frame";
import { getWordsCover } from "../logic/words-cover";
import LANDSCAPE_ART from "../../../../assets/images/fun/hero-golden-landscape.png";
import CARDS_ART from "../../../../assets/images/fun/hero-bible-character-cards.png";

const MIN_HEIGHT = 164;
const PADDING = 20;
/** The landscape (1200 × 400): the card's full width, along its bottom. */
const LANDSCAPE: ArtPlacement = { share: 1, aspect: 3, right: 0, anchor: "bottom" };
/**
 * The character cards (660 × 440), measured off the mockup: 59% of the
 * card's width, a little over its right edge, sitting on its bottom.
 */
const CARDS: ArtPlacement = { share: 0.59, aspect: 1.5, right: -0.03, anchor: "bottom" };
/** The words keep to this share, over the landscape's pale left, clear of the cards. */
const WORDS_WIDTH = "58%";
/**
 * Where the cover over the art behind the words runs, as shares of the
 * card's width: solid to where the character cards begin to show, clear a
 * little past where the words end.
 */
const COVER = { solidTo: 0.5, clearAt: 0.75 } as const;

/** Decoration only: VoiceOver passes over it. */
const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type QuickPlayHeroProps = {
  onPlay: () => void;
  testID: string;
};

/**
 * Today's quick-play game, featured at the top of Fun: Heads Up with Bible
 * characters, on a cream-to-gold dawn with a golden landscape along its
 * bottom and the character cards fanned on the right. On a card too narrow
 * for its words — a small phone, or large text — its own gradient covers the
 * art behind them, so they stay easy to read. A kicker in the accent,
 * the title with its running time, a line on how it's played, and Play now.
 */
export function QuickPlayHero({ onPlay, testID }: QuickPlayHeroProps) {
  const theme = useTheme();
  const ink = theme.colors.inkOnLight;
  const muted = theme.colors.inkOnLightMuted;
  const dawn = theme.colors.illustrationDawn;
  const stops = getBackdropStops(
    [dawn, theme.colors.illustrationDawnLight, theme.colors.illustrationDawnDeep],
    dawn,
  );
  const { fontScale } = useWindowDimensions();
  // Sized in points from the card's own measure — a percentage would leave the
  // art at its file's full size.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const landscape = getArtFrame(box, LANDSCAPE);
  const cards = getArtFrame(box, CARDS);
  const cover = getWordsCover({ cardWidth: box.width, fontScale });

  return (
    <View
      testID={testID}
      onLayout={({ nativeEvent }) =>
        setBox({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
      }
      style={[styles.card, { backgroundColor: dawn, borderRadius: theme.radii.card }]}
    >
      <GradientBackdrop stops={stops} />
      <Image
        testID={`${testID}-landscape`}
        source={LANDSCAPE_ART}
        resizeMode="contain"
        style={[styles.art, landscape]}
        {...HIDDEN}
      />
      <Image
        testID={`${testID}-cards`}
        source={CARDS_ART}
        resizeMode="contain"
        style={[styles.art, cards]}
        {...HIDDEN}
      />
      {/* The card's own gradient again, over the art behind the words, when they'd crowd it. */}
      {cover > 0 && (
        <View
          testID={`${testID}-cover`}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: cover }]}
          {...HIDDEN}
        >
          <GradientBackdrop
            stops={stops}
            reveal={{
              from: box.width * COVER.clearAt,
              to: box.width * COVER.solidTo,
              axis: "x",
            }}
          />
        </View>
      )}

      <View style={styles.words}>
        <Text
          style={[
            theme.typography.metaEmphasis,
            styles.kicker,
            { color: theme.colors.accent, marginBottom: theme.spacing.sm },
          ]}
        >
          Quick play today
        </Text>
        <View style={[styles.titleRow, { gap: theme.spacing.sm }]}>
          <Text style={[theme.typography.cardTitle, { color: ink }]}>Heads Up:</Text>
          <Tag
            testID={`${testID}-duration`}
            icon={Clock3}
            label="60 sec"
            color={muted}
            background={theme.colors.overlayButtonLight}
          />
        </View>
        <Text style={[theme.typography.cardTitle, { color: ink }]}>Bible Characters</Text>
        <Text
          style={[
            theme.typography.cardDetail,
            { color: muted, marginTop: theme.spacing.xs, marginBottom: theme.spacing.md },
          ]}
        >
          Guess the person before time runs out.
        </Text>
      </View>

      <CompactButton
        testID={`${testID}-play`}
        label="Play now"
        icon={ArrowRight}
        iconPosition="end"
        tone="accent"
        align="start"
        onPress={onPlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: MIN_HEIGHT, padding: PADDING, overflow: "hidden" },
  // Placed by `getArtFrame`, against the card's right edge.
  art: { position: "absolute" },
  words: { width: WORDS_WIDTH },
  kicker: { textTransform: "uppercase", letterSpacing: 1 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
});
