import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { Pause, Play } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";

/** Its corners. */
export const SERMON_CLIP_RADIUS = radius[36];
const PLAY_SIZE = 48;
const ICON_SIZE = 20;

export type SermonClipCardProps = {
  /** Whether the clip is playing: pause shows, and the clock runs. */
  playing: boolean;
  /** Where the clip starts, or how far in it's playing: "12:34". */
  clock: string;
  /** The play disc's press, where it's animated (Welcome's tour). */
  discStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  testID?: string;
};

/**
 * "Hear this part of the sermon": where the day's reading comes from in the
 * sermon, and when that part starts — or, playing, how far in it is. Playing
 * it isn't built yet: the study always shows it stopped, and only Welcome's
 * tour plays it.
 */
export function SermonClipCard({ playing, clock, discStyle, testID }: SermonClipCardProps) {
  const theme = useTheme();
  const Icon = playing ? Pause : Play;

  return (
    <Card testID={testID} radius={SERMON_CLIP_RADIUS} fill="page" style={styles.card}>
      <Animated.View
        testID={testID && `${testID}-disc`}
        style={[styles.play, { backgroundColor: theme.colors.controlPrimary }, discStyle]}
      >
        <Icon
          size={ICON_SIZE}
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
