import { StyleSheet, View } from "react-native";
import { Play } from "lucide-react-native";

import { formatDuration } from "@/utils/time/formatDuration";
import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";

const RADIUS = radius[36];
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
    <Card radius={RADIUS} fill="page" style={styles.card}>
      <View style={[styles.play, { backgroundColor: theme.colors.controlPrimary }]}>
        <Play
          size={20}
          color={theme.colors.onControlPrimary}
          strokeWidth={theme.icon.strokeWidth}
        />
      </View>
      <View style={styles.text}>
        <SFProBody variant="listItem" numberOfLines={1}>
          Hear this part of the sermon
        </SFProBody>
        <SFProBody tone="textMuted">{`Starts at ${formatDuration(startSeconds)}`}</SFProBody>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[16],
    paddingVertical: space[14],
    paddingLeft: space[14],
    paddingRight: space[20],
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: space[2] },
});
