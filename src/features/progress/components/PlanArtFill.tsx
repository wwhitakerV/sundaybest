import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { radius, useTheme } from "@/theme";
import type { WeekArt } from "../logic/week-history";

/** A sermon's artwork filling the space it's given, on its own colour — cropped to fit, never stretched. */
export function PlanArtFill({ art }: { art: WeekArt }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.fill,
        {
          borderRadius: radius[10],
          backgroundColor: art.colors[0] ?? theme.colors.segmentBackground,
        },
      ]}
    >
      {art.source !== null && (
        <Image
          source={typeof art.source === "string" ? { uri: art.source } : art.source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: "hidden" },
});
