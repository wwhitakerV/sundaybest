import * as Haptics from "expo-haptics";

/**
 * The app's haptic vocabulary (see `.claude/rules/ui.md`). The native calls
 * can reject on a simulator or a device without a Taptic Engine; a haptic
 * must never break the interaction it decorates, so every rejection is
 * swallowed.
 */
function quietly(feedback: Promise<void>): void {
  feedback.catch(() => undefined);
}

/** A choice changed: a filter, a day, a size, an answer picked. The lightest tick. */
export function selectionFeedback(): void {
  quietly(Haptics.selectionAsync());
}

/** A single gentle tap: starting or moving through something (Continue, Next, the tab bar). */
export function tapFeedback(): void {
  quietly(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** An accomplishment: a day finished, a right answer, a Quick Check done, a plan built. */
export function successFeedback(): void {
  quietly(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** A wrong answer checked: noticed, not a failure. */
export function warningFeedback(): void {
  quietly(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Something failed: a link that isn't one, a plan that couldn't be built. */
export function errorFeedback(): void {
  quietly(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
