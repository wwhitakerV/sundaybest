import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { CircleCheck, CircleX } from "lucide-react-native";

import type { QuizQuestion } from "@/types/domain";
import { Button } from "@/ui/atoms/Button";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { radius, space, useTheme } from "@/theme";
import type { QuickCheckAction } from "../logic/quick-check";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { toneColor, type Tone } from "@/ui/typography/tone";

export type QuickCheckFeedbackProps = {
  /** How the question went — from the store, never worked out here. */
  result: "correct" | "incorrect";
  question: QuizQuestion;
  action: QuickCheckAction;
  onAction: () => void;
};

/**
 * The verdict once a question's checked, rising from the bottom of the
 * screen in its colour: "That's the one" or "Not quite", why (the passage,
 * then the explanation), and the way on.
 */
export function QuickCheckFeedback({
  result,
  question,
  action,
  onAction,
}: QuickCheckFeedbackProps) {
  const theme = useTheme();
  // The screen keeps clear of the home indicator; the panel's colour runs on under it.
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const right = result === "correct";
  const tone: Tone = right ? "correct" : "incorrect";
  const ink = toneColor(theme.colors, tone);
  const Icon = right ? CircleCheck : CircleX;
  const why = [question.scriptureReference, question.explanation].filter(Boolean).join(". ");

  return (
    <View
      testID="quick-check-feedback"
      style={[
        styles.panel,
        { marginBottom: -(bottomInset + EDGE), paddingBottom: bottomInset + EDGE },
        {
          backgroundColor: right ? theme.colors.correctSurface : theme.colors.incorrectSurface,
          borderColor: right ? theme.colors.correctBorder : theme.colors.incorrectBorder,
        },
      ]}
    >
      <View style={styles.verdict}>
        <Icon size={22} color={ink} strokeWidth={theme.icon.strokeWidth} />
        <SFProTitle variant="headline" tone={tone}>
          {right ? "That's the one" : "Not quite"}
        </SFProTitle>
      </View>
      {why ? <SFProBody tone={tone}>{why}</SFProBody> : null}
      <Button testID={action.testID} label={action.label} onPress={onAction} />
    </View>
  );
}

/**
 * The panel's edge. It's drawn all the way round — a top edge alone fades out
 * where the corners curve — and the panel reaches this far past the screen's
 * sides and bottom, so only its top and the curves show.
 */
const EDGE = 1;

const styles = StyleSheet.create({
  // Runs to the screen's edges, past the page inset, with rounded top corners.
  panel: {
    marginHorizontal: -(PAGE_INSET + EDGE),
    paddingHorizontal: PAGE_INSET + EDGE,
    paddingTop: space[24],
    gap: space[16],
    borderWidth: EDGE,
    borderTopLeftRadius: radius[36],
    borderTopRightRadius: radius[36],
  },
  verdict: { flexDirection: "row", alignItems: "center", gap: space[10] },
});
