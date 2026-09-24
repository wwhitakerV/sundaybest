import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { STAGE_SLIDE } from "../logic/story";

/** Rising in: unhurried, settling with a soft give rather than a bounce. */
const RISE_SPRING = { duration: STAGE_SLIDE.inMs, dampingRatio: 0.82 } as const;
/**
 * The hop before the drop: a quick springy rise toward `HOP_Y` that the drop
 * takes over from partway (`STAGE_SLIDE.hopMs`), so it rushes straight on down.
 */
const HOP_Y = -9;
const HOP_SPRING = { duration: 160, dampingRatio: 0.6 } as const;
/** How long the caption takes to fade as the phone drops. */
const CAPTION_FADE_MS = 400;

/**
 * The phone (and the hand behind it) sliding the full height of the stage,
 * `distance` points: it starts below the stage's bottom and springs up into
 * place when `shown`. When not, it waits for the hand to fold
 * (`STAGE_SLIDE.outDelayMs`), hops up on a quick spring and, straight out of
 * the hop, rushes down out of the bottom, gathering speed, while the
 * caption fades. It never rises more than `maxRise` points above its place, so it
 * never leaves the top of the stage. Springs and timings respect the system
 * reduce-motion setting.
 *
 * The slide is tracked as progress (1 = in place, 0 = just out of view) so
 * the stage's measured height can change under it; the pop rides on top.
 */
export function useStageSlide(shown: boolean, distance: number, maxRise: number) {
  const progress = useSharedValue(0);
  const hopY = useSharedValue(0);
  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    if (shown) {
      hopY.value = 0;
      captionOpacity.value = 1;
      progress.value = withSpring(1, RISE_SPRING);
    } else {
      hopY.value = withDelay(STAGE_SLIDE.outDelayMs, withSpring(HOP_Y, HOP_SPRING));
      progress.value = withDelay(
        STAGE_SLIDE.outDelayMs + STAGE_SLIDE.hopMs,
        // Leaves the top of the bounce smoothly and picks up speed quickly.
        withTiming(0, { duration: STAGE_SLIDE.dropMs, easing: Easing.in(Easing.quad) }),
      );
      captionOpacity.value = withDelay(
        STAGE_SLIDE.outDelayMs,
        withTiming(0, { duration: CAPTION_FADE_MS, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [shown, progress, hopY, captionOpacity]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(-maxRise, hopY.value + (1 - progress.value) * distance) }],
  }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOpacity.value }));

  return { slideStyle, captionStyle };
}
