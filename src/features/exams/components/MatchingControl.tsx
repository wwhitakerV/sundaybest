import { Text, View } from "react-native";

import type { ExamPair, ExamResponse } from "@/types/domain";
import { AnswerRow, type AnswerRowState } from "@/ui/AnswerRow";
import { announce } from "@/core/accessibility/announce";
import { useTheme } from "@/theme";
import { getMatchingFeedback } from "../logic/feedback";
import { pairTarget } from "../logic/responses";
import type { ExamQuestion, QuestionReveal } from "../types";

type MatchingQuestion = Extract<ExamQuestion, { kind: "matching" }>;

export type MatchingControlProps = {
  question: MatchingQuestion;
  response: ExamResponse | null;
  reveal: QuestionReveal | null;
  onChange?: (response: ExamResponse) => void;
};

/**
 * Each prompt with its own choice of target. A target pairs once: one
 * already in use says where, and picking it moves it here, leaving the
 * prompt it left unanswered — never swapped — and VoiceOver says so. Once
 * revealed, each prompt shows its right target and its feedback.
 */
export function MatchingControl({ question, response, reveal, onChange }: MatchingControlProps) {
  const theme = useTheme();
  const pairs: ExamPair[] = response && "pairs" in response ? response.pairs : [];
  const labelOf = (promptId: string) =>
    question.prompts.find((prompt) => prompt.id === promptId)?.label ?? promptId;
  const feedback = reveal
    ? getMatchingFeedback({
        prompts: question.prompts,
        response,
        key: reveal.key,
        feedback: reveal.feedback,
      })
    : null;

  const pick = (promptId: string, targetId: string) => {
    if (!onChange) return;
    const next = pairTarget(pairs, promptId, targetId);
    onChange({ kind: "matching", pairs: next.pairs });
    if (next.movedFrom) {
      const from = labelOf(next.movedFrom);
      announce(`Moved from ${from}. ${from} is now unanswered.`);
    }
  };

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {question.prompts.map((prompt) => {
        const own = pairs.find((pair) => pair.promptId === prompt.id)?.targetId ?? null;
        const revealed = feedback?.find((entry) => entry.promptId === prompt.id);
        return (
          <View key={prompt.id} style={{ gap: theme.spacing.sm }}>
            <Text style={[theme.typography.metaLabel, { color: theme.colors.text }]}>
              {prompt.label}
            </Text>
            {question.targets.map((target) => {
              const holder = pairs.find((pair) => pair.targetId === target.id)?.promptId;
              let state: AnswerRowState = own === target.id ? "selected" : "idle";
              let status: string | undefined =
                holder && holder !== prompt.id ? `Used for ${labelOf(holder)}` : undefined;
              if (revealed) {
                const isRight = target.id === revealed.correctTargetId;
                const isPicked = target.id === revealed.pickedTargetId;
                state = isRight ? "correct" : isPicked ? "incorrect" : "faded";
                status = isRight
                  ? isPicked
                    ? "Your match · Correct"
                    : "Correct match"
                  : isPicked
                    ? "Your match · Incorrect"
                    : undefined;
              }
              return (
                <AnswerRow
                  key={target.id}
                  testID={`exam-match-${prompt.id}-${target.id}`}
                  label={target.label}
                  marker={{ shape: "radio" }}
                  state={state}
                  picked={own === target.id}
                  accessibilityRole="radio"
                  accessibilityLabel={[`${prompt.label}: ${target.label}`, status]
                    .filter(Boolean)
                    .join(". ")}
                  {...(status !== undefined && { status })}
                  {...(!revealed && onChange ? { onPress: () => pick(prompt.id, target.id) } : {})}
                />
              );
            })}
            {revealed?.text ? (
              <Text style={[theme.typography.cardDetail, { color: theme.colors.textInactive }]}>
                {revealed.text}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
