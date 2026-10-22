import { StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SerifTitle } from "@/ui/typography/SerifTitle";

/**
 * The question's halo: a soft edge of the page's white round each letter, so
 * black paint landing over the question never swallows its black type.
 */
const HALO_RADIUS = 6;

export type QuestionLineProps = {
  question: string;
  /** Where the atmosphere's line is, on the board. */
  lineY: number;
};

/**
 * The question now rising, just under the line — where the balloons are
 * headed, so where it's read is where time runs out. Under the board, so
 * paint can land on it; its halo keeps it readable when it does.
 */
export function QuestionLine({ question, lineY }: QuestionLineProps) {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={[styles.line, { top: lineY + space[16] }]}>
      <SerifTitle
        testID="rise-question"
        variant="question"
        accessibilityRole="header"
        style={[
          styles.words,
          {
            textShadowColor: colors.background,
            textShadowRadius: HALO_RADIUS,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {question}
      </SerifTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { position: "absolute", left: PAGE_INSET, right: PAGE_INSET },
  words: { textAlign: "center" },
});
