import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { OLD_TESTAMENT_BOOKS } from "../logic/bible-books";
import { lineCentre } from "../logic/map-geometry";

export type MapBookNamesProps = {
  /** The map's width at zoom 1. */
  width: number;
  zoom: SharedValue<number>;
  offset: SharedValue<number>;
};

/**
 * Where to find yourself under the map — Genesis at its start, Matthew where
 * the New Testament begins, Revelation at its end — each riding with the map
 * as it zooms and slides, and out of sight when its place is.
 */
export function MapBookNames({ width, zoom, offset }: MapBookNamesProps) {
  const genesis = useAnimatedStyle(() => ({ left: offset.get() }));
  const matthew = useAnimatedStyle(() => ({
    left: offset.get() + lineCentre(OLD_TESTAMENT_BOOKS, width) * zoom.get(),
  }));
  const revelation = useAnimatedStyle(() => ({
    right: width - (offset.get() + width * zoom.get()),
  }));

  return (
    <View style={[styles.names, { marginTop: space[8] }]}>
      {/* A line's height of the face, so the row keeps its room while its names ride. */}
      <MonoLabel variant="label" style={styles.hidden}>
        Genesis
      </MonoLabel>
      <Animated.View style={[styles.name, genesis]}>
        <MonoLabel variant="label" tone="textMuted">
          Genesis
        </MonoLabel>
      </Animated.View>
      <Animated.View style={[styles.name, matthew]}>
        <MonoLabel variant="label" tone="textMuted">
          Matthew
        </MonoLabel>
      </Animated.View>
      <Animated.View style={[styles.name, revelation]}>
        <MonoLabel variant="label" tone="textMuted">
          Revelation
        </MonoLabel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Names past the map's edges are cut off with it.
  names: { overflow: "hidden" },
  hidden: { opacity: 0 },
  name: { position: "absolute", top: 0 },
});
