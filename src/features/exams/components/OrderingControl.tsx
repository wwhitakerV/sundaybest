import { View } from "react-native";

import type { ExamResponse } from "@/types/domain";
import { AnswerRow } from "@/ui/AnswerRow";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { getOrderingFeedback } from "../logic/feedback";
import { togglePlacedStep } from "../logic/responses";
import type { ExamQuestion, QuestionReveal } from "../types";

type OrderingQuestion = Extract<ExamQuestion, { kind: "ordering" }>;

export type OrderingControlProps = {
  question: OrderingQuestion;
  response: ExamResponse | null;
  reveal: QuestionReveal | null;
  onChange?: (response: ExamResponse) => void;
};

/**
 * The steps, numbered in the order they're tapped: tap one again to take it
 * out, or clear them all. No dragging. Once revealed, the right sequence,
 * each place marked right or wrong, with its feedback.
 */
export function OrderingControl({ question, response, reveal, onChange }: OrderingControlProps) {
  const theme = useTheme();
  const placed = response && "stepIds" in response ? response.stepIds : [];
  const total = question.steps.length;
  const labelOf = (stepId: string | null) =>
    question.steps.find((step) => step.id === stepId)?.label ?? null;

  if (reveal) {
    const feedback = getOrderingFeedback({
      response,
      key: reveal.key,
      feedback: reveal.feedback,
    });
    return (
      <View style={{ gap: theme.spacing.sm }}>
        {feedback.map((entry) => {
          const label = `${entry.position}. ${labelOf(entry.stepId) ?? entry.stepId}`;
          const placedLabel = labelOf(entry.pickedStepId);
          const status = entry.right
            ? "In place"
            : placedLabel
              ? `You placed: ${placedLabel}`
              : "Not placed";
          return (
            <AnswerRow
              key={entry.stepId}
              testID={`exam-order-step-${entry.stepId}`}
              label={label}
              marker={{ shape: "number", number: entry.position }}
              state={entry.right ? "correct" : "incorrect"}
              status={status}
              detail={entry.text}
              accessibilityLabel={`${label}. ${status}`}
            />
          );
        })}
      </View>
    );
  }

  const place = (stepId: string) =>
    onChange?.({ kind: "ordering", stepIds: togglePlacedStep(placed, stepId) });

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {question.steps.map((step) => {
        const index = placed.indexOf(step.id);
        const number = index === -1 ? null : index + 1;
        return (
          <AnswerRow
            key={step.id}
            testID={`exam-order-step-${step.id}`}
            label={step.label}
            marker={{ shape: "number", number }}
            state="idle"
            accessibilityLabel={
              number === null
                ? `${step.label}. Not placed yet`
                : `${step.label}. Position ${number} of ${total}`
            }
            {...(onChange ? { onPress: () => place(step.id) } : {})}
          />
        );
      })}
      <Button
        testID="exam-order-clear-button"
        label="Clear order"
        variant="secondary"
        disabled={!onChange || placed.length === 0}
        onPress={() => onChange?.({ kind: "ordering", stepIds: [] })}
      />
    </View>
  );
}
