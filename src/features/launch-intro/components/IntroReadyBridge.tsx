import { useEffect } from "react";
import type { SharedValue } from "react-native-reanimated";

import { logger } from "@/core/monitoring/logger";
import { useLaunchReady } from "@/core/providers/launch-ready";

export type IntroReadyBridgeProps = {
  /** Set true once the page underneath is ready: the intro's clock reads it. */
  ready: SharedValue<boolean>;
  /** Where the intro is, for the development log. */
  time: SharedValue<number>;
};

/**
 * Carries "the page underneath is ready" to the intro's clock on the UI thread.
 * It's the only part of the intro that listens for it, so the page becoming
 * ready — the moment it mounts — never re-renders the intro itself.
 */
export function IntroReadyBridge({ ready, time }: IntroReadyBridgeProps) {
  const isReady = useLaunchReady();

  useEffect(() => {
    ready.set(isReady);
    if (isReady) {
      // Development only (the logger is silent in production): when the page became
      // ready, against the intro's own time, to line up with anything seen on screen.
      logger.debug("Launch intro: the page underneath is ready", {
        introMs: Math.round(time.get()),
      });
    }
  }, [isReady, ready, time]);

  return null;
}
