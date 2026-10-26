import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { space, useTheme } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { TRACK_COPY } from "../logic/formation-track-copy";

/** How far one station's words travel as the track moves a station (points), and how soon they fade. */
const TEXT = { travel: 56, fade: 1.6 };
/** The words' box: tall enough for a label, a two-line title and three lines. */
const TEXT_HEIGHT = 168;
/** The short red rule over each station's words. */
const RULE = { width: 24, height: 2 };

type Copy = (typeof TRACK_COPY)[number];

/** One station's words, rolling up with the track: in place at its own station, gone a station either side. */
function StationWords({
  copy,
  index,
  shown,
}: {
  copy: Copy;
  index: number;
  shown: SharedValue<number>;
}) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    const off = index - shown.value;
    return {
      opacity: Math.max(0, 1 - Math.abs(off) * TEXT.fade),
      transform: [{ translateY: off * TEXT.travel }],
    };
  });
  return (
    <Animated.View style={[styles.words, style]}>
      <View style={[styles.rule, { backgroundColor: colors.accent }]} />
      <MonoLabel variant="label" tone="accent">
        {copy.label}
      </MonoLabel>
      <SerifTitle variant="heading" style={styles.title} numberOfLines={2}>
        {copy.title}
      </SerifTitle>
      <SFProBody variant="note" tone="textSupporting" numberOfLines={3}>
        {copy.body}
      </SFProBody>
    </Animated.View>
  );
}

export type TrackTextProps = { shown: SharedValue<number>; width: number; testID?: string };

/**
 * The words of the station in hand, beside it: each station's words roll
 * up with the track, one to one with the finger — half way between two, both
 * show half way — never cross-fading on their own.
 */
export function TrackText({ shown, width, testID }: TrackTextProps) {
  return (
    <View testID={testID} pointerEvents="none" style={[styles.box, { width }]}>
      {TRACK_COPY.map((copy, i) => (
        <StationWords key={copy.label} copy={copy} index={i} shown={shown} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: TEXT_HEIGHT, overflow: "hidden" },
  words: { ...StyleSheet.absoluteFill, gap: space[8] },
  rule: { width: RULE.width, height: RULE.height, marginBottom: space[4] },
  title: { marginTop: space[2] },
});
