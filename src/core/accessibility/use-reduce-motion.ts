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
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
