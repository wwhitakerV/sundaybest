import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { ReadingPaper } from "@/types/domain";
import { READING_PAPERS, getReadingTheme, motion, radius, space, useTheme } from "@/theme";

/** A swatch is a page in miniature: 9 wide to 16 tall. */
const ASPECT = 9 / 16;
/** The white between a swatch and the border round the one picked. */
const RING_GAP = space[4];
const RING = 2;
const LINE = 3;
/** Faux lines of text on a swatch, as fractions of its width. */
const LINES = [0.9, 1, 0.8, 0.95, 1, 0.6] as const;
/** Slides as the day picker's highlight does. */
const SPRING = { ...motion.slide, reduceMotion: ReduceMotion.System };
const GAP = space[12];
/** Room round the row for the border to sit in. */
const INSET = RING_GAP + RING;

export type PaperPickerProps = {
  selected: ReadingPaper;
  onSelect: (paper: ReadingPaper) => void;
  testID: string;
};

/**
 * The papers the study can be read on, each a 9:16 page in miniature with
 * lines of faux text in its own ink. One border, set off by a little white,
 * slides to the paper picked.
 */
export function PaperPicker({ selected, onSelect, testID }: PaperPickerProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const count = READING_PAPERS.length;
  const swatch = width > 0 ? (width - INSET * 2 - GAP * (count - 1)) / count : 0;
  const index = Math.max(
    0,
    READING_PAPERS.findIndex((paper) => paper.id === selected),
  );
  const target = index * (swatch + GAP);

  return (
    <View
      testID={testID}
      accessibilityRole="radiogroup"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={styles.row}
    >
      {/* Remade once the row is measured, so it starts on the paper picked. */}
      <PaperRing
        key={swatch > 0 ? "measured" : "unmeasured"}
        x={target}
        swatch={swatch}
        testID={`${testID}-indicator`}
      />
      {READING_PAPERS.map((paper) => {
        const ink = getReadingTheme(paper.id).colors.textInactive;
        return (
          <Pressable
            key={paper.id}
            testID={`${testID}-${paper.id}`}
            accessibilityRole="radio"
            accessibilityLabel={paper.label}
            accessibilityState={{ selected: paper.id === selected }}
            onPress={() => onSelect(paper.id)}
            style={[
              styles.swatch,
              { backgroundColor: paper.background, borderColor: theme.colors.divider },
            ]}
          >
            {LINES.map((share, line) => (
              <View
                key={line}
                style={[styles.line, { width: `${share * 100}%`, backgroundColor: ink }]}
              />
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

/** The border round the paper picked: in place from the start, then sliding to the next. */
function PaperRing({ x, swatch, testID }: { x: number; swatch: number; testID: string }) {
  const theme = useTheme();
  const position = useSharedValue(x);
  useEffect(() => {
    position.set(withSpring(x, SPRING));
  }, [position, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() }] }));

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: swatch + INSET * 2,
          height: swatch / ASPECT + INSET * 2,
          borderColor: theme.colors.text,
          opacity: swatch > 0 ? 1 : 0,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: GAP, padding: INSET },
  swatch: {
    flex: 1,
    aspectRatio: ASPECT,
    borderWidth: 1,
    borderRadius: radius[10],
    padding: space[6],
    gap: space[4],
  },
  line: { height: LINE, borderRadius: LINE / 2 },
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
    borderWidth: RING,
    // Concentric with the swatch: its corner and the inset around it.
    borderRadius: radius[16],
  },
});
