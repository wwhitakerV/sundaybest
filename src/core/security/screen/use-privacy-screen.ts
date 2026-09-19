import { useEffect } from "react";
import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  usePreventScreenCapture,
} from "expo-screen-capture";

/**
 * Hides a screen's contents from screenshots, screen recordings, and the app
 * switcher, for as long as the component using it is mounted.
 *
 * Two separate protections, because they cover different leaks:
 *
 * - `usePreventScreenCapture` stops a deliberate screenshot or recording.
 * - `enableAppSwitcherProtectionAsync` blurs the snapshot iOS takes when the app
 *   goes to the background. That snapshot is written to disk and survives until
 *   the app is next foregrounded, so without this it is the easier of the two to
 *   read off a device.
 *
 * Per-screen rather than app-wide on purpose. Blanket screenshot blocking annoys
 * users who have a legitimate reason to capture an ordinary screen, and an
 * always-on blur makes the app switcher useless. Call this only from screens
 * that actually show something worth hiding.
 *
 * It lives in `src/core` because `expo-screen-capture` is a side-effect SDK and
 * `AGENTS.md` confines those to core, lint-enforced.
 */
export function usePrivacyScreen(key?: string): void {
  usePreventScreenCapture(key);

  useEffect(() => {
    // Failures are swallowed deliberately. This is a hardening measure, and a
    // screen that refuses to render because a blur could not be applied is a
    // worse outcome than a screen without the blur. The same call on unmount
    // means a missed enable cannot leave the protection stuck on.
    void enableAppSwitcherProtectionAsync().catch(() => undefined);

    return () => {
      void disableAppSwitcherProtectionAsync().catch(() => undefined);
    };
  }, []);
}
