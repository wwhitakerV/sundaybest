import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { radius, useTheme } from "@/theme";
import type { WeekArt } from "../logic/week-history";

/** A thumbnail, 16:9, as a plan card's artwork reads at a glance. */
const THUMB = { width: 64, height: 36 } as const;
/** How far each later sermon's art steps in under the one before. */
const STEP = 10;
/** Up to this many shown; past it the week's title says how many. */
const MOST = 3;
/** The page's colour round each, so the overlap reads. */
const RING = 1.5;

/** A week's sermon artwork: one, or a few overlapped, newest on top — each on its own colour. */
export function WeekArtStack({ art }: { art: readonly WeekArt[] }) {
  const theme = useTheme();
  const shown = art.slice(0, MOST);

  return (
    <View
      style={{
        width: THUMB.width + STEP * (shown.length - 1),
        height: THUMB.height + STEP * (shown.length - 1),
      }}
    >
      {shown
        .map((item, index) => (
          <View
            // A week's sermons in their order: a thumbnail's place is its identity.
            key={`art-${index}`}
            style={[
              styles.thumb,
              {
                top: STEP * index,
                left: STEP * index,
                borderRadius: radius[10],
                borderColor: theme.colors.background,
                backgroundColor: item.colors[0] ?? theme.colors.segmentBackground,
              },
            ]}
          >
            {item.source !== null && (
              <Image
                source={typeof item.source === "string" ? { uri: item.source } : item.source}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            )}
          </View>
        ))
        .reverse()}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    position: "absolute",
    width: THUMB.width,
    height: THUMB.height,
    borderWidth: RING,
    overflow: "hidden",
  },
});
