import { StyleSheet, Text, View } from "react-native";
import { Play } from "lucide-react-native";

import { formatDuration } from "@/utils/time/formatDuration";
import { useTheme } from "@/theme";

const RADIUS = 36;
const PLAY_SIZE = 48;

export type SermonClipCardProps = {
  /** Where this part of the sermon starts, in seconds. */
  startSeconds: number;
};

/**
 * "Hear this part of the sermon": where the day's reading comes from in the
 * sermon, and when that part starts. Shows the way to it; playing it isn't
 * built yet.
 */
export function SermonClipCard({ startSeconds }: SermonClipCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
      ]}
    >
      <View style={[styles.play, { backgroundColor: theme.colors.controlPrimary }]}>
        <Play
          size={20}
          color={theme.colors.onControlPrimary}
          strokeWidth={theme.icon.strokeWidth}
        />
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[theme.typography.listItem, { color: theme.colors.text }]}>
          Hear this part of the sermon
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          {`Starts at ${formatDuration(startSeconds)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 20,
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
});
