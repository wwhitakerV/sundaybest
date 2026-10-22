import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { SerifBody } from "@/ui/typography/SerifBody";
import { ribbonLanding } from "../logic/ribbon";

/** How far below its place a letter starts. */
const RISE = 7;
/** How much smaller it starts: growing up into its place, never down onto it. */
const SMALL = 0.12;
/** How far it starts tipped back on its baseline, lying flat like a ribbon before it stands. */
const TIP_DEG = 70;
/** The depth the tip is seen with: enough to read as turning, not as squashing. */
const PERSPECTIVE = 320;

/** The kinds of words the ribbon writes: a smaller opening line, then the note. */
export type RibbonKind = "intro" | "note";

export type RibbonLetterProps = {
  letter: string;
  slot: number;
  progress: SharedValue<number>;
  kind: RibbonKind;
};

/**
 * One letter of the ribbon, unfurling upward: it starts just below its place,
 * a little small, tipped back on its baseline, and swings up into place as it
 * rises — so the line seems to stand up out of the page, never to drop onto it.
 */
export function RibbonLetter({ letter, slot, progress, kind }: RibbonLetterProps) {
  const landing = useAnimatedStyle(() => {
    const landed = ribbonLanding(progress.get(), slot);
    const away = 1 - landed;
    return {
      opacity: landed,
      transform: [
        { perspective: PERSPECTIVE },
        { translateY: RISE * away },
        { rotateX: `${TIP_DEG * away}deg` },
        { scale: 1 - SMALL * away },
      ],
    };
  });

  return (
    <Animated.View style={[styles.letter, landing]}>
      <SerifBody variant={kind === "intro" ? "line" : "standfirst"}>{letter}</SerifBody>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Hinged at its foot: it turns up about its baseline.
  letter: { flexShrink: 0, transformOrigin: "bottom" },
});
