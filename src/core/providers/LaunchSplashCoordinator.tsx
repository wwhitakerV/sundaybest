import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { useCurrentUserQuery, useUserSettingsQuery } from "@/core/api/reader-queries";
import { usePlansQuery } from "@/core/api/plan-queries";
import {
  getMeResponseSchema,
  getSettingsResponseSchema,
  listPlansResponseSchema,
} from "@/core/api/contracts";
import { offlineCacheKeys, persistServerCache } from "@/core/api/offline-cache";
import { LaunchReadyContext } from "./launch-ready";

/**
 * Lifts the plain-white native splash as soon as the app has drawn — the launch
 * intro, white too, is already over it — and tells the intro when the first
 * page (Welcome or Home) is genuinely ready to be revealed (`useLaunchReady`).
 * It is launch-only: once ready, route queries can show local/cached pending
 * states but the launch never comes back.
 *
 * Plans are prefetched for both new and returning users. That means Welcome's
 * sample-plan action is already backed by the real API, while a returning user's
 * Home plan data is committed before the intro reveals it. Settings are also
 * awaited so global text scaling cannot visibly jump after the reveal.
 */
/**
 * The longest the reveal waits on plans and settings. Who the reader is
 * (`me`) is always waited for — it decides Welcome or Home — but the rest moves
 * on to its skeletons rather than holding for a whole timeout.
 */
const LAUNCH_HOLD_MAX_MS = 2500;

/**
 * The longest the reveal is ever held, however the launch is going — the reader
 * never arriving, a page that never mounts — so the app is never left stuck
 * behind the launch intro. The intro reaches full red at about 6.3s.
 */
export const LAUNCH_REVEAL_MAX_MS = 8000;

export function LaunchSplashCoordinator({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const me = useCurrentUserQuery();
  const plans = usePlansQuery();
  const settings = useUserSettingsQuery();
  const onboarded = Boolean(me.data?.user.onboardedAt);

  const serverBootstrapDone = !me.isPending && !plans.isPending && !settings.isPending;
  // Wherever the launch lands is the page to reveal: Welcome for a new reader; for a returning
  // one, wherever they've moved on to from the first route — Home, or a plan opened from a link.
  const landed = !onboarded || pathname !== "/";
  const [heldTooLong, setHeldTooLong] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const ready = gaveUp || (!me.isPending && (serverBootstrapDone || heldTooLong) && landed);

  useEffect(() => {
    const timer = setTimeout(() => setHeldTooLong(true), LAUNCH_HOLD_MAX_MS);
    const cap = setTimeout(() => setGaveUp(true), LAUNCH_REVEAL_MAX_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(cap);
    };
  }, []);

  useEffect(() => {
    if (!me.data) return;
    void persistServerCache({
      cacheKey: offlineCacheKeys.me,
      resourceType: "me",
      schema: getMeResponseSchema,
      value: me.data,
    });
    if (settings.data) {
      void persistServerCache({
        cacheKey: offlineCacheKeys.settings,
        resourceType: "settings",
        schema: getSettingsResponseSchema,
        value: settings.data,
      });
    }
    if (plans.data) {
      void persistServerCache({
        cacheKey: offlineCacheKeys.plans,
        resourceType: "plans",
        schema: listPlansResponseSchema,
        value: plans.data,
      });
    }
  }, [me.data, plans.data, settings.data]);

  // The native splash is plain white, and the launch intro is drawn white over the app in
  // the same commit. Two committed frames are enough for it to be on screen before iOS
  // starts the splash's fade, so the hand-off is invisible.
  useEffect(() => {
    const first = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void SplashScreen.hideAsync();
      });
    });
    return () => cancelAnimationFrame(first);
  }, []);

  return <LaunchReadyContext.Provider value={ready}>{children}</LaunchReadyContext.Provider>;
}
