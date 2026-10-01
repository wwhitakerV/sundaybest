import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { REFLECT_ANSWER, getReflectScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Span } from "@/ui/typography/Span";

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
      <SFProBody>
        {REFLECT_ANSWER.slice(0, typedChars)}
        {writing && <Span tone="accent">|</Span>}
      </SFProBody>
    </View>
  );
}

/** Its corners — shared with the floating card it lifts onto. */
export const ANSWER_BOX_RADIUS = radius[20];

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: ANSWER_BOX_RADIUS, padding: space[18], minHeight: 124 },
});
