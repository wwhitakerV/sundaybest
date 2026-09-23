import { Image, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/theme";
import sermonThumbnail from "../../../../../assets/images/welcome/sermon-thumbnail.png";
import { usePressPulse } from "../../hooks/use-tap-feedback";
import { getPreviewScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

/** The video thumbnail's own proportions — 16:9 — so it's never squashed or cropped. */
const THUMBNAIL_ASPECT = 16 / 9;
const RADIUS = 18;

/**
 * The sermon's video thumbnail, at its true 16:9 with rounded corners, and
 * its running time. As its scene plays, it's tapped into.
 */
export function SermonThumbnail({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const { tapped } = getPreviewScene(elapsedMs);
  const pressStyle = usePressPulse(tapped);

  return (
    <Animated.View style={[styles.frame, pressStyle]}>
      <Image
        source={sermonThumbnail}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        style={[
          styles.duration,
          { backgroundColor: theme.colors.mediaScrim, borderRadius: theme.radii.pill },
        ]}
      >
        <Text style={[theme.typography.metaLabel, { color: theme.colors.onMediaScrim }]}>
          42:18
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: RADIUS, overflow: "hidden" },
  image: { width: "100%", aspectRatio: THUMBNAIL_ASPECT },
  duration: {
    position: "absolute",
    right: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
