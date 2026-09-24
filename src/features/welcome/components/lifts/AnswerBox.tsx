import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { REFLECT_ANSWER, getReflectScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

/** The reflection answer box. As its scene plays, the answer is written out. */
export function AnswerBox({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const { typedChars } = getReflectScene(elapsedMs);
  const writing = typedChars < REFLECT_ANSWER.length;

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
      ]}
    >
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>
        {REFLECT_ANSWER.slice(0, typedChars)}
        {writing && <Text style={{ color: theme.colors.accent }}>|</Text>}
      </Text>
    </View>
  );
}

/** Its corners — shared with the floating card it lifts onto. */
export const ANSWER_BOX_RADIUS = 20;

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: ANSWER_BOX_RADIUS, padding: 18, minHeight: 124 },
});
