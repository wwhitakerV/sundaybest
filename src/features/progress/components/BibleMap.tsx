import { Fragment, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeOut,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from "react-native-reanimated";

import { motion, radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { bookAt, clampOffset, clampZoom, lineCentre } from "../logic/map-geometry";
import { getNearestStudied, type MapLine as MapLineData } from "../logic/word-map";
import { MapBookNames } from "./MapBookNames";
import { MapLine } from "./MapLine";

/** The tallest line's height: Psalms. */
const LINES_HEIGHT = 100;
/** The mark under the book picked, and its room. */
const MARK_HEIGHT = 3;
const MARK_GAP = 4;
/** The book's label leaves softly when the finger lifts. */
const LABEL_EXIT = FadeOut.duration(motion.exitMs);
/** A drag this far is a slide, not a tap. */
const SLIDE_SLOP = 8;

export type BibleMapProps = {
  lines: readonly MapLineData[];
  /** The book picked: its line in the accent, a mark beneath it. */
  selected: string | null;
  /** A studied book picked from the map: the nearest to a tap. */
  onSelect: (book: string) => void;
  /** A finger on the map, or none: the page holds its back swipe meanwhile. */
  onTouching: (touching: boolean) => void;
  testID: string;
};

/**
 * The whole Bible as 66 lines, Genesis to Revelation, a break between the
 * Testaments: dark where the reader has been, the book picked in the accent
 * with a mark beneath it. It opens zoomed all the way out. A pinch zooms in,
 * about the fingers, to a dozen books across; a drag then slides it along,
 * gliding to a stop; at full width a sideways swipe does nothing — never the
 * page's back. A finger on it names the book under it; a tap picks the
 * nearest studied book.
 */
export function BibleMap({ lines, selected, onSelect, onTouching, testID }: BibleMapProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const zoom = useSharedValue(1);
  const offset = useSharedValue(0);
  const from = useSharedValue({ zoom: 1, offset: 0 });
  // This touch pinched; and its pinch is down to one finger, the map held where it was.
  const pinched = useSharedValue(false);
  const held = useSharedValue(false);
  const labelWidth = useSharedValue(0);
  const hovered = useSharedValue(-1);

  const press = (index: number | null) => {
    setHover(index);
    onTouching(index !== null);
  };
  const tapAt = (index: number) => {
    const nearest = getNearestStudied(lines, index);
    if (nearest) onSelect(nearest);
  };

  // The book under a finger, from where it touches the map as zoomed and slid.
  const under = (x: number) => {
    "worklet";
    return bookAt((x - offset.get()) / zoom.get(), width);
  };
  const pinch = Gesture.Pinch()
    .onStart(() => {
      cancelAnimation(offset);
      pinched.set(true);
      held.set(false);
      from.set({ zoom: zoom.get(), offset: offset.get() });
    })
    .onUpdate((event) => {
      // A finger lifted first: iOS goes on reporting the pinch about the one left, which would
      // drag the map to it. The map holds where both fingers left it, for the rest of the touch.
      if (held.get() || event.numberOfPointers < 2) {
        held.set(true);
        return;
      }
      // Zoomed about the fingers: the point between them stays under them.
      const next = clampZoom(from.get().zoom * event.scale);
      const point = (event.focalX - from.get().offset) / from.get().zoom;
      offset.set(clampOffset(event.focalX - point * next, next, width));
      zoom.set(next);
    });
  const slide = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-SLIDE_SLOP, SLIDE_SLOP])
    .onBegin((event) => {
      // A new touch: whatever a pinch held in the last one is let go.
      pinched.set(false);
      held.set(false);
      cancelAnimation(offset);
      const index = under(event.x);
      hovered.set(index);
      // Measured afresh for this book's name: hidden until then, so it never shows in the wrong place.
      labelWidth.set(0);
      runOnJS(press)(index);
    })
    .onStart(() => {
      from.set({ zoom: zoom.get(), offset: offset.get() });
    })
    .onUpdate((event) => {
      // A touch that pinched never turns into a slide: the finger left behind moves nothing.
      if (pinched.get()) return;
      offset.set(clampOffset(from.get().offset + event.translationX, zoom.get(), width));
    })
    .onEnd((event) => {
      if (pinched.get()) return;
      offset.set(withDecay({ velocity: event.velocityX, clamp: [width - width * zoom.get(), 0] }));
    })
    .onFinalize(() => {
      // The label stays on its book as it fades away — never thrown back to Genesis first.
      runOnJS(press)(null);
    });
  const tap = Gesture.Tap()
    .maxDistance(SLIDE_SLOP)
    .onEnd((event, success) => {
      if (success) runOnJS(tapAt)(under(event.x));
    });
  const gesture = Gesture.Exclusive(Gesture.Simultaneous(pinch, slide), tap);

  const labelStyle = useAnimatedStyle(() => {
    const centre = offset.get() + lineCentre(Math.max(hovered.get(), 0), width) * zoom.get();
    const left = Math.min(centre - labelWidth.get() / 2, width - labelWidth.get());
    return { left: Math.max(left, 0), opacity: labelWidth.get() > 0 ? 1 : 0 };
  });
  const hoveredLine = hover === null ? null : lines[hover];

  return (
    <GestureHandlerRootView testID={testID} style={styles.root}>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <GestureDetector gesture={gesture}>
          <View
            testID={`${testID}-surface`}
            accessibilityRole="adjustable"
            accessibilityLabel="The books of the Bible"
            {...(selected && { accessibilityValue: { text: selected } })}
            // VoiceOver steps through the studied books.
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={({ nativeEvent }) => {
              const studied = lines.filter((line) => line.studied).map((line) => line.book);
              const at = selected === null ? -1 : studied.indexOf(selected);
              const next = studied[at + (nativeEvent.actionName === "increment" ? 1 : -1)];
              if (next) onSelect(next);
            }}
            style={[styles.surface, { height: LINES_HEIGHT + MARK_GAP + MARK_HEIGHT }]}
          >
            {width > 0 &&
              lines.map((line, index) => (
                // Each line and its mark stand on the map's floor.
                <Fragment key={line.book}>
                  <MapLine
                    index={index}
                    width={width}
                    zoom={zoom}
                    offset={offset}
                    height={LINES_HEIGHT * line.share}
                    bottom={MARK_GAP + MARK_HEIGHT}
                    color={
                      line.book === selected
                        ? theme.colors.accent
                        : line.studied
                          ? theme.colors.text
                          : theme.colors.progressTrack
                    }
                  />
                  {line.book === selected && (
                    <MapLine
                      testID={`${testID}-mark`}
                      index={index}
                      width={width}
                      zoom={zoom}
                      offset={offset}
                      height={MARK_HEIGHT}
                      bottom={0}
                      color={theme.colors.accent}
                    />
                  )}
                </Fragment>
              ))}
          </View>
        </GestureDetector>
        {width > 0 && <MapBookNames width={width} zoom={zoom} offset={offset} />}
      </View>

      {hoveredLine && (
        <Animated.View
          testID={`${testID}-label`}
          pointerEvents="none"
          exiting={LABEL_EXIT}
          onLayout={(event) => labelWidth.set(event.nativeEvent.layout.width)}
          style={[
            styles.label,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.containerBorder,
              borderRadius: radius.pill,
              paddingHorizontal: space[12],
              paddingVertical: space[4],
              shadowColor: theme.colors.shadow,
              ...theme.elevation.menu,
            },
            labelStyle,
          ]}
        >
          <SFProBody variant="label" tone={hoveredLine.studied ? "text" : "textMuted"}>
            {hoveredLine.book}
          </SFProBody>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Its own gesture root, so the chart's pinch and slide work wherever it sits.
  root: { flex: 0 },
  // Lines zoomed past the map's edges are cut off with it.
  surface: { overflow: "hidden" },
  // Floating over the map's top, above the finger.
  label: { position: "absolute", bottom: "100%", marginBottom: space[8], borderWidth: 1 },
});
