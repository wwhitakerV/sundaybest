import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Sparkles } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { usePressPulse } from "../../hooks/use-tap-feedback";
import { getCreateScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { SFProLabel } from "@/ui/typography/SFProLabel";

export const CREATE_BUTTON_HEIGHT = 64;

/** "Create my plan". As its scene plays, it's pressed. */
export function CreateButton({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const { pressed } = getCreateScene(elapsedMs);
  const pressStyle = usePressPulse(pressed);

  return (
    <Animated.View
      style={[
        styles.button,
        { backgroundColor: theme.colors.controlPrimary, borderRadius: radius.pill },
        pressStyle,
      ]}
    >
      <Sparkles
        size={22}
        color={theme.colors.onControlPrimary}
        strokeWidth={theme.icon.strokeWidth}
      />
      <SFProLabel tone="onControlPrimary">Create my plan</SFProLabel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: CREATE_BUTTON_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[10],
  },
});
