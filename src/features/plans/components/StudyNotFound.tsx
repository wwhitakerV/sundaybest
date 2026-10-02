import { useModalSession } from "@/hooks/use-modal-session";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";

export type StudyNotFoundProps = {
  testID: string;
};

/**
 * What a Daily Study screen shows when its plan or day isn't there — a plan
 * since removed, or a link that doesn't name one — with the way out of the
 * session.
 */
export function StudyNotFound({ testID }: StudyNotFoundProps) {
  const session = useModalSession();

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
