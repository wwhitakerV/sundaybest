import { NotFoundScreen } from "./NotFoundScreen";

export type ScreenLoadErrorProps = {
  testID: string;
  title?: string;
  message?: string;
  onRetry: () => void;
  /**
   * The way out beside the retry ("Back to Plans"). A tab's own screen can
   * leave it out — its tabs are the way out — but a pushed or modal screen
   * never does.
   */
  leave?: { label: string; onPress: () => void };
};

/**
 * A route-local load failure. Unlike the launch splash, this never takes the
 * user back through app startup; it stays in the screen they asked for, offers
 * the request again, and — off the tabs — a way out, so it's never a loop.
 */
export function ScreenLoadError({
  testID,
  title = "Couldn't load this page",
  message = "SundayBest couldn't reach your data. Check your connection and try again.",
  onRetry,
  leave,
}: ScreenLoadErrorProps) {
  return (
    <NotFoundScreen
      testID={testID}
      title={title}
      message={message}
      actionLabel="Try again"
      onAction={onRetry}
      {...(leave && { secondary: leave })}
    />
  );
}
