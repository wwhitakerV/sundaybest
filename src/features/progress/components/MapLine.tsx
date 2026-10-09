import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { radius } from "@/theme";
import { columnWidth, lineCentre } from "../logic/map-geometry";

/** A line's share of its column: the rest is the air between lines. */
const LINE_SHARE = 0.55;
/** As thin, and as thick, as a line gets — zoomed right in, a bar, never a slab. */
const LINE_LEAST = 2;
const LINE_MOST = 10;

export type MapLineProps = {
  index: number;
  /** The map's width at zoom 1. */
  width: number;
  zoom: SharedValue<number>;
  offset: SharedValue<number>;
  height: number;
  /** From the map's floor to the line's foot. */
  bottom: number;
  color: string;
  testID?: string;
};

/** One book's line, placed for the map's zoom and slide on every frame — crisp at any zoom. */
export function MapLine({
  index,
  width,
  zoom,
  offset,
  height,
  bottom,
  color,
  testID,
}: MapLineProps) {
  const style = useAnimatedStyle(() => {
    const lineWidth = Math.min(
      Math.max(LINE_LEAST, columnWidth(width, zoom.get()) * LINE_SHARE),
      LINE_MOST,
    );
    const centre = offset.get() + lineCentre(index, width) * zoom.get();
    return { left: centre - lineWidth / 2, width: lineWidth };
  });

  return (
    <Animated.View
      {...(testID && { testID })}
      style={[
        styles.line,
        { height, bottom, backgroundColor: color, borderRadius: radius.pill },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: { position: "absolute" },
});
