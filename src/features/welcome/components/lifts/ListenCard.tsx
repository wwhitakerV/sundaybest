import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Pause, Play } from "lucide-react-native";

import { useTheme } from "@/theme";
import { usePressPulse } from "../../hooks/use-tap-feedback";
import { getListenScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

const PLAY_SIZE = 48;
const RADIUS = 36;

/**
 * "Hear this part of the sermon": the Read step's link to where this reading
 * comes from in the sermon. As its scene plays, play is pressed — it turns to
 * pause, and the sermon's clock starts ticking.
 */
export function ListenCard({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const { playing, clock } = getListenScene(elapsedMs);
  const pressStyle = usePressPulse(playing);
  const Icon = playing ? Pause : Play;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
      ]}
    >
      <Animated.View
        style={[styles.play, { backgroundColor: theme.colors.controlPrimary }, pressStyle]}
      >
        <Icon
          size={20}
          color={theme.colors.onControlPrimary}
          strokeWidth={theme.icon.strokeWidth}
        />
      </Animated.View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[theme.typography.listItem, { color: theme.colors.text }]}>
          Hear this part of the sermon
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          {playing ? `Playing · ${clock}` : `Starts at ${clock}`}
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
