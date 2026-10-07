import { StyleSheet, View } from "react-native";
import { Check, X } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifBody } from "@/ui/typography/SerifBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Span } from "@/ui/typography/Span";
import type { QuizReviewItem } from "../logic/quick-check-review";

const VERDICT_ICON = 14;
const ANSWER_ICON = 16;
const ICON_STROKE = 2.5;

export type QuickCheckReviewCardProps = {
  item: QuizReviewItem;
  testID: string;
};

/**
 * One question on the score page, reviewed: its number, where it's from and
 * whether it was right; what was asked (a verse with its right word in
 * place); the answer given, the right one beside it if it was missed; and why.
 */
export function QuickCheckReviewCard({ item, testID }: QuickCheckReviewCardProps) {
  const missed = item.result === "incorrect";

  return (
    <Card testID={testID} radius={24} style={styles.card}>
      <View style={styles.head}>
        <MonoLabel variant="labelTracked" tone="textMuted">
          {item.number}
        </MonoLabel>
        <MonoLabel variant="labelTracked" tone="textMuted" style={styles.kicker}>
          {item.kicker}
        </MonoLabel>
        {item.result !== "unanswered" && <Verdict right={!missed} testID={`${testID}-verdict`} />}
      </View>

      {item.verse ? (
        <SerifBody variant="standfirst" testID={`${testID}-prompt`}>
          {item.verse.before}
          <Span tone="correct" style={styles.filled}>
            {item.verse.answer}
          </Span>
          {item.verse.after}
        </SerifBody>
      ) : (
        <SFProBody variant="bodyLoose" testID={`${testID}-prompt`}>
          {item.prompt}
        </SFProBody>
      )}

      {item.yours !== null && (
        <View style={styles.answers}>
          <AnswerLine
            label="Your answer"
            text={item.yours}
            right={!missed}
            testID={`${testID}-yours`}
          />
          {item.rightAnswer !== null && (
            <AnswerLine label="Answer" text={item.rightAnswer} right testID={`${testID}-answer`} />
          )}
        </View>
      )}

      {item.why !== null && (
        <SFProBody variant="detail" tone="textMuted">
          {item.why}
        </SFProBody>
      )}
    </Card>
  );
}

/** Right or Missed, in words and colour both, never colour alone. */
function Verdict({ right, testID }: { right: boolean; testID: string }) {
  const theme = useTheme();
  const Icon = right ? Check : X;

  return (
    <View
      testID={testID}
      style={[
        styles.verdict,
        {
          backgroundColor: right ? theme.colors.correctSurface : theme.colors.incorrectSurface,
          borderColor: right ? theme.colors.correctBorder : theme.colors.incorrectBorder,
        },
      ]}
    >
      <Icon
        size={VERDICT_ICON}
        color={right ? theme.colors.correct : theme.colors.incorrect}
        strokeWidth={ICON_STROKE}
      />
      <MonoLabel tone={right ? "correct" : "incorrect"}>{right ? "Right" : "Missed"}</MonoLabel>
    </View>
  );
}

/** An answer, labelled, marked right or wrong. */
function AnswerLine({
  label,
  text,
  right,
  testID,
}: {
  label: string;
  text: string;
  right: boolean;
  testID: string;
}) {
  const theme = useTheme();
  const Icon = right ? Check : X;

  return (
    <View style={styles.answerLine}>
      <Icon
        size={ANSWER_ICON}
        color={right ? theme.colors.correct : theme.colors.incorrect}
        strokeWidth={ICON_STROKE}
        style={styles.answerIcon}
      />
      <View style={styles.answerWords}>
        <MonoLabel tone="textMuted">{label}</MonoLabel>
        <SFProBody tone={right ? "correct" : "incorrect"} testID={testID}>
          {text}
        </SFProBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space[20], gap: space[16] },
  head: { flexDirection: "row", alignItems: "center", gap: space[12] },
  kicker: { flex: 1, textTransform: "uppercase" },
  verdict: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space[10],
    paddingVertical: space[4],
  },
  filled: { textDecorationLine: "underline" },
  answers: { gap: space[12] },
  answerLine: { flexDirection: "row", alignItems: "flex-start", gap: space[12] },
  answerIcon: { marginTop: space[2] },
  answerWords: { flex: 1, gap: space[2] },
});
