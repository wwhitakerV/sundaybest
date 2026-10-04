import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import {
  useCurrentUserQuery,
  usePlansQuery,
  useUserSettingsQuery,
} from "@/core/api/queries";

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
  const ready = serverBootstrapDone && destinationReady;

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
