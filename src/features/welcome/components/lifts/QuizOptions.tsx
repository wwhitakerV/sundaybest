import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Check } from "lucide-react-native";

import { useTheme } from "@/theme";
import { useFadeTo, usePopIn } from "../../hooks/use-tap-feedback";
import { getQuizScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

// Short enough to sit on one line each, at real size, without truncating.
const OPTIONS = [
  { letter: "A", text: "Build an altar" },
  { letter: "B", text: "Choose whom to serve" },
  { letter: "C", text: "Return to Egypt" },
] as const;
const ANSWER = "B";
/** Once the answer is shown, the wrong options step back. */
const DIMMED_OPACITY = 0.35;

function Option({
  letter,
  text,
  picked,
  right,
  dimmed,
}: {
  letter: string;
  text: string;
  picked: boolean;
  right: boolean;
  dimmed: boolean;
}) {
  const theme = useTheme();
  const markStyle = usePopIn(right);
  const fadeStyle = useFadeTo(dimmed ? DIMMED_OPACITY : 1);

  return (
    <Animated.View
      style={[
        styles.option,
        {
          backgroundColor: theme.colors.surface,
          borderColor: right
            ? theme.colors.selected
            : picked
              ? theme.colors.text
              : theme.colors.divider,
          borderWidth: picked ? 2 : 1,
        },
        fadeStyle,
      ]}
    >
      <View
        style={[
          styles.letter,
          {
            borderColor: theme.colors.divider,
            backgroundColor: right
              ? theme.colors.selected
              : picked
                ? theme.colors.controlPrimary
                : "transparent",
          },
        ]}
      >
        {right ? (
          <Animated.View style={markStyle}>
            <Check size={16} color={theme.colors.onControlPrimary} strokeWidth={3} />
          </Animated.View>
        ) : (
          <Text
            style={[
              theme.typography.label,
              { color: picked ? theme.colors.onControlPrimary : theme.colors.textMuted },
            ]}
          >
            {letter}
          </Text>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[theme.typography.body, styles.text, { color: theme.colors.text }]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

/**
 * The Quick Check answers. As its scene plays, B is picked, turns into a
 * green check, and the wrong answers dim.
 */
export function QuizOptions({ elapsedMs }: LiftPieceProps) {
  const scene = getQuizScene(elapsedMs);

  return (
    <View style={styles.options}>
      {OPTIONS.map(({ letter, text }) => {
        const isAnswer = letter === ANSWER;
        return (
          <Option
            key={letter}
            letter={letter}
            text={text}
            picked={isAnswer && scene.picked}
            right={isAnswer && scene.revealed}
            dimmed={!isAnswer && scene.revealed}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  letter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
});
