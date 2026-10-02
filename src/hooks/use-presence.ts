import { useEffect, useState } from "react";
import {
  Easing,
  ReduceMotion,
  runOnJS,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";

type EnterSpring = (typeof motion)["snap" | "sheet"];

/**
 * For something that animates in and out of view — a sheet, a menu: whether
 * it's mounted (still, while it leaves) and how far in it is, 0 gone to 1
 * shown. In on `enter`, a spring that lands without a bounce; out on a short
 * ease, unmounting once it's gone. Reduced motion skips straight to the end.
 */
export function usePresence(visible: boolean, enter: EnterSpring = motion.snap) {
  const [mounted, setMounted] = useState(visible);
  // Mounted the moment it's asked for, so it's there to animate in.
  if (visible && !mounted) setMounted(true);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.set(withSpring(1, { ...enter, reduceMotion: ReduceMotion.System }));
      return;
    }
    // Nothing on screen to take away.
    if (!mounted) return;
    progress.set(
      withTiming(
        0,
        {
          duration: motion.exitMs,
          easing: Easing.in(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        },
        // Not when it's cut short by opening again.
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      ),
    );
  }, [visible, mounted, enter, progress]);

  return { mounted, progress };
}
