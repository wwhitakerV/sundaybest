import * as Haptics from "expo-haptics";
import { Vibration } from "react-native";

/**
 * A single gentle tap, for a navigation press (tab bar, FAB). `impactAsync`
 * can reject on a simulator or a device without a Taptic Engine; a haptic
 * must never break the interaction it decorates, so the rejection is
 * swallowed.
 */
export function tapFeedback(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/**
 * The Daily Study entrance buzz: one uninterrupted native vibration.
 * Cancels any vibration already in flight first so repeated entrances never
 * stack.
 */
export function sparkBuzz(): void {
  Vibration.cancel();
  Vibration.vibrate();
}
