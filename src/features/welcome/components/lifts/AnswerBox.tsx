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
    <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>
        {REFLECT_ANSWER.slice(0, typedChars)}
        {writing && <Text style={{ color: theme.colors.accent }}>|</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 20, padding: 18, minHeight: 124 },
});
