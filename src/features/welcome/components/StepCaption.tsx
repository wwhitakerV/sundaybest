import { useState } from "react";
import { StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useBurstIn } from "../hooks/use-burst-in";
import type { CaptionState } from "../logic/story";
import { WELCOME_STEPS } from "./welcome-steps";

const ICON_SIZE = 18;

type Shown = { step: number; word: number | null };

export type StepCaptionProps = {
  caption: CaptionState;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The how-it-works step for the card on stage, right under its lifted UI.
 * Bursts in each time a new step (or a new item of step 3) takes over, with
 * that item picked out and the rest dimmed; fades away between turns.
 */
export function StepCaption({ caption, style, testID }: StepCaptionProps) {
  const theme = useTheme();

  // Keep showing the last step while fading out, rather than flipping to another.
  const [shown, setShown] = useState<Shown | null>(null);
  if (caption.mode === "step" && (shown?.step !== caption.step || shown.word !== caption.word)) {
    setShown({ step: caption.step, word: caption.word });
  }

  const burstKey = caption.mode === "step" ? `${caption.step}:${caption.word ?? "-"}` : null;
  const burstStyle = useBurstIn(burstKey);
  const step = shown ? WELCOME_STEPS.at(shown.step) : undefined;
  if (!step || !shown) return null;
  const { Icon } = step;

  return (
    <Animated.View testID={testID} style={[styles.row, style, burstStyle]}>
      <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={1.75} />
      <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
        {step.parts.map((part, index) => (
          <Text
            key={part}
            style={{
              color:
                shown.word === null || shown.word === index
                  ? theme.colors.text
                  : theme.colors.textMuted,
            }}
          >
            {part}
          </Text>
        ))}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
});
