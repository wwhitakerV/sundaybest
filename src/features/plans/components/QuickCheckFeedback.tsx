import type { QuizQuestion } from "@/types/domain";
import { Button } from "@/ui/atoms/Button";
import { FeedbackPanel } from "@/ui/organisms/FeedbackPanel";
import type { QuickCheckAction } from "../logic/quick-check";

export type QuickCheckFeedbackProps = {
  /** How the question went — from the store, never worked out here. */
  result: "correct" | "incorrect";
  question: QuizQuestion;
  action: QuickCheckAction;
  onAction: () => void;
};

/**
 * The verdict once a question's checked, rising from the bottom of the
 * screen in its colour (`FeedbackPanel`): "That's the one" or "Not quite",
 * why (the passage, then the explanation), and the way on.
 */
export function QuickCheckFeedback({
  result,
  question,
  action,
  onAction,
}: QuickCheckFeedbackProps) {
  const why = [question.scriptureReference, question.explanation].filter(Boolean).join(". ");

  return (
    <FeedbackPanel
      testID="quick-check-feedback"
      tone={result}
      title={result === "correct" ? "That's the one" : "Not quite"}
      {...(why && { detail: why })}
    >
      <Button testID={action.testID} label={action.label} onPress={onAction} />
    </FeedbackPanel>
  );
}
