import { useModalSession } from "@/hooks/use-modal-session";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { classifyStudyFailure } from "../logic/study-failure";

export type StudyNotFoundProps = {
  testID: string;
  /** What went wrong, if anything did; nothing means the day simply isn't there. */
  error?: unknown;
  /** Asks again; a refetch's promise is fine — the screen re-renders with its result. */
  onRetry?: () => unknown;
};

/**
 * What a Daily Study screen shows when it has nothing to show — never a dead
 * end. A day not open yet says so and goes back to the plan; a missing day
 * closes; and only a failure to reach the server offers to try again, always
 * with a way out beside it.
 */
export function StudyNotFound({ testID, error, onRetry }: StudyNotFoundProps) {
  const session = useModalSession();
  const failure = classifyStudyFailure(error);

  if (failure === "locked") {
    return (
      <NotFoundScreen
        testID={testID}
        title="This day isn’t open yet"
        message="Days open one at a time: finish the day before it, and come back on its day."
        actionLabel="Back to plan"
        onAction={session.exit}
      />
    );
  }

  if (failure === "unreachable" && onRetry) {
    return (
      <NotFoundScreen
        testID={testID}
        title="Couldn’t load this study"
        message="SundayBest couldn’t reach your study. Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void onRetry()}
        secondary={{ label: "Close", onPress: session.exit }}
      />
    );
  }

  return (
    <NotFoundScreen
      testID={testID}
      title="This day isn’t here"
      message="Its plan may have been removed, or the link is out of date."
      actionLabel="Close"
      onAction={session.exit}
    />
  );
}
