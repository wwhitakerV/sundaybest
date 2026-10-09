import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { motion, radius, space } from "@/theme";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Span } from "@/ui/typography/Span";
import type { MatchPart } from "../logic/plan-search";

/** The artwork, small: enough to know the sermon by, leaving the title room. */
const THUMBNAIL_WIDTH = 96;

const MOVE = LinearTransition.duration(motion.results.moveMs);
const ENTER = FadeIn.duration(motion.results.enterMs);
const EXIT = FadeOut.duration(motion.exitMs);

export type PlanSearchRowProps = {
  title: string;
  /** The title in runs, the words searched marked. */
  parts: readonly MatchPart[];
  /** Why it matched and where it stands, the words marked: "VOUS Church · Day 2 of 7". */
  detail: readonly MatchPart[];
  thumbnailUrl: string | null;
  onPress: () => void;
  testID: string;
};

/**
 * One plan found: its artwork, small; its title — regular, up to two lines,
 * the words searched in black and medium, the rest grey; and under it why it
 * matched and where it stands. The whole row opens it. It keeps its
 * place in the tree as the results change, moving to where it now ranks.
 */
export function PlanSearchRow({
  title,
  parts,
  detail,
  thumbnailUrl,
  onPress,
  testID,
}: PlanSearchRowProps) {
  return (
    <Animated.View layout={MOVE} entering={ENTER} exiting={EXIT}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={[
          styles.row,
          { gap: space[16], paddingVertical: space[10], paddingHorizontal: PAGE_INSET },
        ]}
      >
        <VideoThumbnail uri={thumbnailUrl} style={styles.thumbnail} />
        <View style={[styles.copy, { gap: space[2] }]}>
          {/* A title with the words in it goes grey around them, so they stand out; one without stays whole. */}
          <SFProBody
            variant="result"
            tone={parts.some((part) => part.match) ? "textSupporting" : "text"}
            numberOfLines={2}
          >
            <Marked parts={parts} />
          </SFProBody>
          <SFProBody variant="rowDetail" tone="textSupporting" numberOfLines={1}>
            <Marked parts={detail} />
          </SFProBody>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** A line's runs: the words searched in the text's own black and medium, the rest as the line is. */
function Marked({ parts }: { parts: readonly MatchPart[] }) {
  return parts.map((part, at) => (
    <Span key={`${at}:${part.text}`} {...(part.match && { match: true, tone: "text" as const })}>
      {part.text}
    </Span>
  ));
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  thumbnail: { width: THUMBNAIL_WIDTH, borderRadius: radius[10] },
  copy: { flex: 1 },
});
