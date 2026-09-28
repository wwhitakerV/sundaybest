import { Image, StyleSheet, Text, View } from "react-native";
import { Clock, Play } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { Tag } from "@/ui/Tag";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import HEADS_UP_ART from "../../../../assets/images/fun/01_heads_up_hero_graphic.png";

/** The art's own shape: 447 × 344. */
const ART_ASPECT = 447 / 344;
/**
 * The art's share of the card's width. It sits in the lower right, flush
 * with the card's edges; its top and left dissolve into the card's dawn.
 */
const ART_WIDTH = "60%";
/** The words under the title keep to this share, clear of the art's figures. */
const WORDS_WIDTH = "50%";
const PADDING = 20;

export type QuickPlayHeroProps = {
  onPlay: () => void;
  testID: string;
};

/**
 * Today's quick-play game, featured at the top of Fun: Heads Up with Bible
 * characters, in a hazy dawn, its cards and hourglass fanned in the lower
 * right. The strongest thing on the page — a kicker in the accent, a large
 * title with its running time, a line on how it's played, and Play now.
 */
export function QuickPlayHero({ onPlay, testID }: QuickPlayHeroProps) {
  const theme = useTheme();
  const ink = theme.colors.inkOnLight;
  const muted = theme.colors.inkOnLightMuted;
  const dawn = theme.colors.illustrationDawn;

  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: dawn, borderRadius: theme.radii.xl }]}
    >
      <GradientBackdrop
        stops={getBackdropStops(
          [dawn, theme.colors.illustrationDawnLight, theme.colors.illustrationDawnDeep],
          dawn,
        )}
      />
      <Image source={HEADS_UP_ART} style={styles.art} />

      <Text style={[theme.typography.metaEmphasis, styles.kicker, { color: theme.colors.accent }]}>
        Quick play today
      </Text>
      <View style={[styles.titleRow, { gap: theme.spacing.sm }]}>
        <Text style={[theme.typography.headline, { color: ink }]}>Heads Up:</Text>
        <Tag
          testID={`${testID}-duration`}
          icon={Clock}
          label="60 sec"
          color={muted}
          background={theme.colors.overlayButtonLight}
        />
      </View>
      <Text style={[theme.typography.headline, { color: ink }]}>Bible Characters</Text>
      <Text
        style={[
          theme.typography.cardDetail,
          styles.detail,
          { color: muted, marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
        ]}
      >
        Guess the person before time runs out.
      </Text>

      <CompactButton
        testID={`${testID}-play`}
        label="Play now"
        icon={Play}
        tone="accent"
        align="start"
        onPress={onPlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: PADDING, overflow: "hidden" },
  art: { position: "absolute", right: 0, bottom: 0, width: ART_WIDTH, aspectRatio: ART_ASPECT },
  kicker: { textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  detail: { width: WORDS_WIDTH },
});
