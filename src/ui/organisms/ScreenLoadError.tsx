import { NotFoundScreen } from "./NotFoundScreen";

export type ScreenLoadErrorProps = {
  testID: string;
  title?: string;
  message?: string;
  onRetry: () => void;
};

/**
 * A route-local load failure. Unlike the launch splash, this never takes the
 * user back through app startup; it stays in the screen they asked for and
 * gives that request one clear retry path.
 */
export function ScreenLoadError({
  testID,
  title = "Couldn't load this page",
  message = "SundayBest couldn't reach your data. Check your connection and try again.",
  onRetry,
}: ScreenLoadErrorProps) {
  return (
    <NotFoundScreen
      testID={testID}
      title={title}
      message={message}
      actionLabel="Try again"
      onAction={onRetry}
    />
  );
}
