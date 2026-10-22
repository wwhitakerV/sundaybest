import { requireOptionalNativeModule } from "expo";
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

/**
 * Our own haptics module (`modules/sundaybest-haptics`): a light impact at an
 * intensity we set, which expo-haptics can't — its lightest is still too firm
 * for a tick that runs the whole time words type. Null on a build without it.
 */
const fine = requireOptionalNativeModule<{ tap(intensity: number): Promise<void> }>(
  "SundayBestHaptics",
);

/** How hard a typing tick lands, 0–1: barely there, felt as a texture. */
const TYPING_INTENSITY = 0.01;

/**
 * Words typing in (Home's welcome): a light impact at low intensity. On a
 * build without our haptics module, the selection tick — the lightest
 * expo-haptics has — stands in.
 */
export function typingFeedback(): void {
  quietly(fine ? fine.tap(TYPING_INTENSITY) : Haptics.selectionAsync());
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

/** Something heavy landing: the launch intro's letters reaching the pool. */
export function dropFeedback(): void {
  quietly(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** The biggest moment there is: the launch intro's pool erupting to fill the screen. */
export function splashFeedback(): void {
  quietly(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** How firmly the brush lands on a RISE balloon: a soft press, felt not heard. */
const PAINT_INTENSITY = 0.3;

/**
 * The brush landing on a RISE balloon, giving under it. On a build without
 * our haptics module, the selection tick stands in.
 */
export function paintFeedback(): void {
  quietly(fine ? fine.tap(PAINT_INTENSITY) : Haptics.selectionAsync());
}

/** A RISE balloon popping clean: light and quick. */
export function popFeedback(): void {
  quietly(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A RISE balloon bursting in black paint: the heaviest knock. */
export function burstFeedback(): void {
  quietly(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}
