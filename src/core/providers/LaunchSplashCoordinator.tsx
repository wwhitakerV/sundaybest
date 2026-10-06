import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { useCurrentUserQuery, usePlansQuery, useUserSettingsQuery } from "@/core/api/queries";
import {
  getMeResponseSchema,
  getSettingsResponseSchema,
  listPlansResponseSchema,
} from "@/core/api/contracts";
import { offlineCacheKeys, persistServerCache } from "@/core/api/offline-cache";

/**
 * Keeps the native splash over React until the first destination is genuinely
 * ready. It is deliberately launch-only: once hidden, route queries can show
 * local/cached pending states but can never bring the launch surface back.
 *
 * Plans are prefetched for both new and returning users. That means Welcome's
 * sample-plan action is already backed by the real API, while a returning user's
 * Home plan data is committed before the native splash fades away. Settings are
 * also awaited so global text scaling cannot visibly jump after the reveal.
 */
/**
 * The longest the splash waits on plans and settings. Who the reader is
 * (`me`) is always waited for — it decides Welcome or Home, and lifting the
 * splash before it is known only swaps one wordmark for another — but the
 * rest moves on to its skeletons rather than holding for a whole timeout.
 */
const LAUNCH_HOLD_MAX_MS = 2500;

export function LaunchSplashCoordinator({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hidden = useRef(false);
  const me = useCurrentUserQuery();
  const plans = usePlansQuery();
  const settings = useUserSettingsQuery();
  const onboarded = Boolean(me.data?.user.onboardedAt);

  const serverBootstrapDone = !me.isPending && !plans.isPending && !settings.isPending;
  const homeMounted = pathname === "/home" || pathname === "/(tabs)/home";
  const destinationReady = !onboarded || homeMounted;
  const [heldTooLong, setHeldTooLong] = useState(false);
  const ready = !me.isPending && (serverBootstrapDone || heldTooLong) && destinationReady;

  useEffect(() => {
    const timer = setTimeout(() => setHeldTooLong(true), LAUNCH_HOLD_MAX_MS);
    return () => clearTimeout(timer);
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

  useEffect(() => {
    if (!ready || hidden.current) return;
    hidden.current = true;

    // The tabs root has no launch transition. Two committed frames are enough
    // for Home/Welcome to lay out beneath the native splash before iOS starts
    // the configured fade, so the first visible frame is already settled.
    const first = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void SplashScreen.hideAsync();
      });
    });

    return () => cancelAnimationFrame(first);
  }, [ready]);

  return children;
}
