import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Play } from "lucide-react-native";

import { useTheme } from "@/theme";

export type VideoThumbnailProps = {
  /** The video's still, if it has one; a plain frame with a play mark stands in until it loads. */
  uri: string | null;
  /** Shown in the corner, e.g. `42:18`. */
  duration?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** A video's thumbnail, 16:9: its still over a quiet frame, a play mark, and its length. */
export function VideoThumbnail({ uri, duration, testID, style }: VideoThumbnailProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[styles.frame, { backgroundColor: theme.colors.segmentBackground }, style]}
    >
      <Play size={32} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
      {uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}
      {duration && (
        <View
          style={[
            styles.duration,
            { backgroundColor: theme.colors.mediaScrim, borderRadius: theme.radii.pill },
          ]}
        >
          <Text style={[theme.typography.stepCounter, { color: theme.colors.onMediaScrim }]}>
            {duration}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  duration: {
    position: "absolute",
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
