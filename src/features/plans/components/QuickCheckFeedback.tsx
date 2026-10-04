import { Button } from "@/ui/atoms/Button";
import { FeedbackPanel } from "@/ui/organisms/FeedbackPanel";
import type { QuickCheckAction } from "../logic/quick-check";
import type { QuickCheckQuestionView } from "../types";

export type QuickCheckFeedbackProps = {
  result: "correct" | "incorrect";
  question: QuickCheckQuestionView;
  action: QuickCheckAction;
  busy?: boolean;
  onAction: () => void;
};

/** The server-verified verdict and the way on. */
export function QuickCheckFeedback({
  result,
  question,
  action,
  busy = false,
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
      <Button
        testID={action.testID}
        label={action.label}
        disabled={busy || !action.enabled}
        onPress={onAction}
      />
    </FeedbackPanel>
  );
}
