import { useModalSession } from "@/hooks/use-modal-session";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";

export type StudyNotFoundProps = {
  testID: string;
  /** A load error stays in the study session and offers a retry instead of exiting it. */
  error?: boolean;
  onRetry?: () => void;
};

/**
 * What a Daily Study screen shows when its plan or day isn't there — or when
 * its first request failed. A network failure can be retried in place; a real
 * missing resource keeps the single way out of the modal session.
 */
export function StudyNotFound({ testID, error = false, onRetry }: StudyNotFoundProps) {
  const session = useModalSession();

  if (error && onRetry) {
    return (
      <NotFoundScreen
        testID={testID}
        title="Couldn't load this study"
        message="SundayBest couldn't reach your study. Check your connection and try again."
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }

  return (
    <NotFoundScreen
      testID={testID}
      title="This day isn't here"
      message="Its plan may have been removed, or the link is out of date."
      actionLabel="Close"
      onAction={session.exit}
    />
  );
}
