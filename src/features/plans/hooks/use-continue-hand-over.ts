import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { isContinueHandedOff } from "../logic/plan-parallax";

/** How quickly Continue fades as it hands over to the tab bar, and back. */
const HANDOFF_FADE_MS = 160;

/**
 * A page's Continue handing over to the tab bar — Plan Overview's, and each
 * of Plans' pages: once it's scrolled up to `line` (down the screen; the
 * nav buttons, the header's foot) it fades away, and `handedOff` says the tab
 * bar should take it; scrolled back down, it fades back. `scrolled` is the
 * page's scroll; `offset` where Continue's measured place starts in it.
 * `handedOff` changes only at the crossing, so the scroll reaches React no
 * more than it must.
 */
export function useContinueHandOver(scrolled: SharedValue<number>, line: number, offset = 0) {
  const [continueTop, setContinueTop] = useState(0);
  const [handedOff, setHandedOff] = useState(false);
  const opacity = useSharedValue(1);

  useAnimatedReaction(
    () => isContinueHandedOff(scrolled.value, continueTop, line),
    (now, before) => {
      if (now === before) return;
      opacity.value = withTiming(now ? 0 : 1, { duration: HANDOFF_FADE_MS });
      runOnJS(setHandedOff)(now);
    },
    [continueTop, line],
  );

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return {
    handedOff,
    /** Continue's fade, whether it's here to press, and where it's measured. */
    continueHandOver: {
      style,
      shown: !handedOff,
      onLayout: (event: LayoutChangeEvent) => setContinueTop(offset + event.nativeEvent.layout.y),
    },
  };
}
