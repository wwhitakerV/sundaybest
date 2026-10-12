import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Whether the user has turned on Reduce Motion (Settings → Accessibility →
 * Motion), kept current if they change it while the app is open.
 *
 * `false` until the OS answers — a moment after mount — so choreography
 * that honours it should tolerate starting and then being cut short.
 * Reanimated's own animations already respect the setting on their own;
 * this is for motion that isn't a single animation, like a scripted intro.
 */
export function useReduceMotion(): boolean {
  return useReduceMotionSetting() ?? false;
}

/**
 * The Reduce Motion setting, or `null` until the OS answers: for choreography
 * that has to choose its path before it starts, like the launch intro, and
 * must never start the wrong one.
 */
export function useReduceMotionSetting(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    // If the OS can't answer, motion is fine: nothing should wait on it for good.
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (mounted) setEnabled(value);
      },
      () => {
        if (mounted) setEnabled(false);
      },
    );
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
