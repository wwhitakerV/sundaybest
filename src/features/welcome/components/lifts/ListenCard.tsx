import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Pause, Play } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { usePressPulse } from "../../hooks/use-tap-feedback";
import { getListenScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { SFProBody } from "@/ui/typography/SFProBody";

const PLAY_SIZE = 48;
/** Its corners — shared with the floating card it lifts onto. */
export const LISTEN_CARD_RADIUS = radius[36];

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
    <Card radius={LISTEN_CARD_RADIUS} fill="page" style={styles.card}>
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
        <SFProBody variant="listItem" numberOfLines={1}>
          Hear this part of the sermon
        </SFProBody>
        <SFProBody tone="textMuted">
          {playing ? `Playing · ${clock}` : `Starts at ${clock}`}
        </SFProBody>
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
