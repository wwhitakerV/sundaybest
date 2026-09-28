import { View } from "react-native";

import type { ExamResponse } from "@/types/domain";
import { AnswerRow, type AnswerRowState } from "@/ui/AnswerRow";
import { useTheme } from "@/theme";
import { getChoiceFeedback, type ChoiceFeedback } from "../logic/feedback";
import { toggleChoice } from "../logic/responses";
import type { ExamQuestion, QuestionReveal } from "../types";

type ChoiceQuestion = Extract<
  ExamQuestion,
  { kind: "single_choice" | "true_false" | "multiple_select" }
>;

export type ChoiceControlProps = {
  question: ChoiceQuestion;
  response: ExamResponse | null;
  /** Present once this answer may be shown. */
  reveal: QuestionReveal | null;
  /** Absent, the choices can't be changed. */
  onChange?: (response: ExamResponse) => void;
};

function statusOf({ state, picked }: ChoiceFeedback): string | undefined {
  if (state === "correct") return picked ? "Your answer · Correct" : "Correct answer";
  if (state === "incorrect") return "Your answer · Incorrect";
  return state === "missed" ? "Missed" : undefined;
}

function pickedIds(response: ExamResponse | null): string[] {
  if (!response) return [];
  if ("choiceId" in response) return [response.choiceId];
  return "choiceIds" in response ? response.choiceIds : [];
}

/**
 * One answer, several, or true/false: a row per choice. Before its reveal a
 * pick is marked in red; once revealed each row says what it was — right,
 * a wrong pick, a missed answer — with the choice's own rationale.
 */
export function ChoiceControl({ question, response, reveal, onChange }: ChoiceControlProps) {
  const theme = useTheme();
  const several = question.kind === "multiple_select";
  const picked = pickedIds(response);
  const feedback = reveal
    ? getChoiceFeedback({
        choices: question.choices,
        response,
        key: reveal.key,
        feedback: reveal.feedback,
      })
    : null;

  const choose = (choiceId: string) => {
    if (!onChange) return;
    if (question.kind === "multiple_select") {
      onChange({ kind: "multiple_select", choiceIds: toggleChoice(picked, choiceId) });
    } else {
      onChange({ kind: question.kind, choiceId });
    }
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {question.choices.map((choice) => {
        const revealed = feedback?.find((entry) => entry.choiceId === choice.id);
        const isPicked = picked.includes(choice.id);
        const state: AnswerRowState = revealed ? revealed.state : isPicked ? "selected" : "idle";
        const status = revealed ? statusOf(revealed) : undefined;
        return (
          <AnswerRow
            key={choice.id}
            testID={`exam-choice-${choice.id}`}
            label={choice.label}
            marker={{ shape: several ? "checkbox" : "radio" }}
            state={state}
            picked={isPicked}
            accessibilityRole={several ? "checkbox" : "radio"}
            accessibilityLabel={[choice.label, status].filter(Boolean).join(". ")}
            {...(status !== undefined && { status })}
            {...(revealed?.rationale ? { detail: revealed.rationale } : {})}
            {...(!revealed && onChange ? { onPress: () => choose(choice.id) } : {})}
          />
        );
      })}
    </View>
  );
}
