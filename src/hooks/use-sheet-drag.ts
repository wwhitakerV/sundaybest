import { useEffect } from "react";
import { Gesture } from "react-native-gesture-handler";
import { ReduceMotion, runOnJS, useSharedValue, withSpring } from "react-native-reanimated";

import { motion } from "@/theme";

/** Let go past this share of the sheet's height, it closes. */
const CLOSE_SHARE = 0.25;
/** Flicked down at least this fast (points a second), it closes however far it went. */
const FLICK = 800;
/** Pulled up, it gives only this much of the pull: a sheet won't rise past its height. */
const RESIST = 0.15;
/** How far a finger moves up or down before it's a drag, not a tap. */
const START = 8;

/**
 * Dragging a sheet down by its top, as iOS's sheets go: it follows the
 * finger down (and barely up); let go past a quarter of its height, or
 * flicked down, it's closed — `onClose`, as a tap above it is; otherwise it
 * springs back. `drag` is how far down it's been pulled, in points; reset
 * each time it's shown again.
 */
export function useSheetDrag(visible: boolean, height: number, onClose: () => void) {
  const drag = useSharedValue(0);

  useEffect(() => {
    if (visible) drag.set(0);
  }, [visible, drag]);

  const gesture = Gesture.Pan()
    .activeOffsetY([-START, START])
    .onUpdate((event) => {
      drag.set(event.translationY > 0 ? event.translationY : event.translationY * RESIST);
    })
    .onEnd((event) => {
      if (event.translationY > height * CLOSE_SHARE || event.velocityY > FLICK) {
        runOnJS(onClose)();
        return;
      }
      drag.set(withSpring(0, { ...motion.sheet, reduceMotion: ReduceMotion.System }));
    });

  return { drag, gesture };
}
