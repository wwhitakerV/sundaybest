import { Image, StyleSheet, Text, View } from "react-native";
import { ArrowRight, Clock3 } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { Tag } from "@/ui/Tag";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import LANDSCAPE_ART from "../../../../assets/images/fun/hero-golden-landscape.png";
import CARDS_ART from "../../../../assets/images/fun/hero-bible-character-cards.png";

const MIN_HEIGHT = 164;
const PADDING = 20;
/** The landscape's own shape (1200 × 400): it runs the card's full width along the bottom. */
const LANDSCAPE_ASPECT = 3;
/** The character cards' own shape (660 × 440), and their share of the card's width. */
const CARDS_ASPECT = 1.5;
const CARDS_WIDTH = "50%";
/** The words keep to this share, over the landscape's pale left, clear of the cards. */
const WORDS_WIDTH = "58%";

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
 * bottom and the character cards fanned on the right. A kicker in the accent,
 * the title with its running time, a line on how it's played, and Play now.
 */
export function QuickPlayHero({ onPlay, testID }: QuickPlayHeroProps) {
  const theme = useTheme();
  const ink = theme.colors.inkOnLight;
  const muted = theme.colors.inkOnLightMuted;
  const dawn = theme.colors.illustrationDawn;

  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: dawn, borderRadius: theme.radii.card }]}
    >
      <GradientBackdrop
        stops={getBackdropStops(
          [dawn, theme.colors.illustrationDawnLight, theme.colors.illustrationDawnDeep],
          dawn,
        )}
      />
      <Image
        testID={`${testID}-landscape`}
        source={LANDSCAPE_ART}
        style={styles.landscape}
        {...HIDDEN}
      />
      <View pointerEvents="none" style={styles.cardsSlot}>
        <Image testID={`${testID}-cards`} source={CARDS_ART} style={styles.cards} {...HIDDEN} />
      </View>

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
  landscape: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: "100%",
    aspectRatio: LANDSCAPE_ASPECT,
  },
  // Holds the cards against the card's right edge, centred top to bottom.
  cardsSlot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: CARDS_WIDTH,
    justifyContent: "center",
  },
  cards: { width: "100%", aspectRatio: CARDS_ASPECT },
  words: { width: WORDS_WIDTH },
  kicker: { textTransform: "uppercase", letterSpacing: 1 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
});
