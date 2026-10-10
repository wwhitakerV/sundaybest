import { StyleSheet, View } from "react-native";
import { Play } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";

/** Each mark in the key: a dot of each colour, and the caret. */
const DOT = 10;
const CARET = 10;

export type RecallKeyProps = {
  /** "36 correct". */
  correct: string;
  /** "12 to revisit". */
  toRevisit: string;
  /** A question's in view under the grid: the caret that marks it, in the key too. */
  showing: boolean;
};

/**
 * The grid's key, and its counts: green, what was correct; amber, what's to
 * revisit; and the red caret, the question selected.
 */
export function RecallKey({ correct, toRevisit, showing }: RecallKeyProps) {
  const theme = useTheme();

  return (
    <View testID="recall-key" style={[styles.row, { gap: space[16] }]}>
      <View style={[styles.row, { gap: space[6] }]}>
        <View
          style={[styles.dot, { borderRadius: radius.pill, backgroundColor: theme.colors.correct }]}
        />
        <SFProBody variant="rowDetail" tone="textSupporting">
          {correct}
        </SFProBody>
      </View>
      <View style={[styles.row, { gap: space[6] }]}>
        <View
          style={[
            styles.dot,
            { borderRadius: radius.pill, backgroundColor: theme.colors.incorrect },
          ]}
        />
        <SFProBody variant="rowDetail" tone="textSupporting">
          {toRevisit}
        </SFProBody>
      </View>
      {showing && (
        <View style={[styles.row, { gap: space[4] }]}>
          {/* Turned as a box, not as the drawing: the icon itself stays unrotated, as it draws surely. */}
          <View style={[{ width: CARET, height: CARET }, styles.down]}>
            <Play
              size={CARET}
              color={theme.colors.accent}
              fill={theme.colors.accent}
              strokeWidth={theme.icon.strokeWidthStrong}
            />
          </View>
          <SFProBody variant="rowDetail" tone="textSupporting">
            Selected
          </SFProBody>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  dot: { width: DOT, height: DOT },
  // The play triangle turned to point down: a caret, as over the grid.
  down: { transform: [{ rotate: "90deg" }] },
});
