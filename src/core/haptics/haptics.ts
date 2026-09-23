import * as Haptics from "expo-haptics";
import { Vibration } from "react-native";

/**
 * A single gentle tap, for a navigation press (tab bar, FAB). Wrapped here so
 * `expo-haptics` is named in exactly one place, per the side-effect-SDK rule.
 *
 * `impactAsync` can reject on a simulator or a device without a Taptic
 * Engine; a haptic that crashes the interaction it is decorating has stopped
 * being a nice-to-have, so the rejection is swallowed rather than surfaced.
 */
export function tapFeedback(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

const SPARK_BUZZ_DURATION_MS = 400;

/**
 * One continuous ~400ms vibration — the Daily Study entrance's "spark
 * burst" feedback. `expo-haptics`'s `impactAsync`/`notificationAsync` are
 * discrete taps with no sustained-duration option, so this uses React
 * Native's own `Vibration` API instead, which is exactly a single
 * uninterrupted buzz for the given duration with no built-in pattern.
 * Wrapped here for the same reason as `tapFeedback`: the side-effect API
 * is named in exactly one place.
 */
export function sparkBuzz(): void {
  Vibration.vibrate(SPARK_BUZZ_DURATION_MS);
}
