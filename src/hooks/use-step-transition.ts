import { useEffect, useRef, useState } from "react";
import {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import {
  getStepTransitionTiming,
  type StepTransitionProfile,
} from "@/utils/motion/getStepTransitionTiming";

/** The body on screen, and how many times it has been swapped. */
type Rendered = { step: number; swaps: number };

export type StepTransitionOptions = {
  /** `brisk` (default) for a UI swap; `calm` for reading. See `getStepTransitionTiming`. */
  profile?: StepTransitionProfile;
  /** The user's Reduce Motion setting, for a calm body to keep its fade but not rise. */
  reduceMotion?: boolean;
};

/**
 * Cross-fades a multi-step screen's body between steps (Daily Study, Quick
 * Check, New Plan). `step` updates at once, so step indicators move
 * immediately; the returned `renderedStep` only follows once the outgoing
 * body has faded and dropped. The incoming body then fades up into place.
 * Timing comes from the profile (`getStepTransitionTiming`): `brisk` drops
 * 8px over 110ms and fades up over 150ms; `calm` fades up over 240ms, easing
 * out, in two beats — `bodyStyle` on the whole body, and `followStyle` on
 * everything below its title, a moment later. The same sequence plays forward
 * and back, the two bodies are never both at full opacity, and nothing
 * animates on first mount. The screen's header and chrome never move.
 *
 * The fade-in starts only once React has actually swapped the body in. It
 * can't start from the fade-out's completion: that runs on the UI thread, and
 * the swap reaches React a few frames later — so for those frames the
 * outgoing body would fade back in.
 */
export function useStepTransition(step: number, options: StepTransitionOptions = {}) {
  const { profile = "brisk", reduceMotion = false } = options;
  const timing = getStepTransitionTiming(profile, reduceMotion);
  const { outMs, inMs, rise, staggerMs } = timing;
  // A calm body's fade is a dissolve, kept even with Reduce Motion on; a
  // brisk one leaves it to the system, which skips it.
  const fadeMotion = timing.fadeWithReducedMotion ? ReduceMotion.Never : ReduceMotion.System;
  const inEasing = profile === "calm" ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad);

  const [rendered, setRendered] = useState<Rendered>({ step, swaps: 0 });
  const progress = useSharedValue(1);
  const follow = useSharedValue(1);
  // The step last acted on — so the fade-out runs only when the step really
  // changes (not on first mount, nor on a re-render with the same step).
  const lastStep = useRef(step);
  // Likewise the swap last faded in.
  const lastSwap = useRef(0);

  useEffect(() => {
    if (lastStep.current === step) return;
    lastStep.current = step;
    // Always a new swap, even back to the body already rendered, so the
    // fade-in below always follows.
    const swapTo = (next: number) =>
      setRendered((previous) => ({ step: next, swaps: previous.swaps + 1 }));
    // The completion callback runs as a worklet on the UI thread, so the
    // React state setter has to hop back to JS through `runOnJS` — calling it
    // directly crashes on device.
    progress.set(
      withTiming(0, { duration: outMs, reduceMotion: fadeMotion }, (finished) => {
        if (finished) runOnJS(swapTo)(step);
      }),
    );
  }, [step, progress, outMs, fadeMotion]);

  // Runs after React has committed the swapped-in body.
  useEffect(() => {
    if (rendered.swaps === lastSwap.current) return;
    lastSwap.current = rendered.swaps;
    const fadeIn = { duration: inMs, easing: inEasing, reduceMotion: fadeMotion };
    progress.set(withTiming(1, fadeIn));
    if (staggerMs > 0) {
      follow.set(0);
      follow.set(withDelay(staggerMs, withTiming(1, fadeIn), fadeMotion));
    }
  }, [rendered.swaps, progress, follow, inMs, inEasing, fadeMotion, staggerMs]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: rise - progress.value * rise }],
  }));
  const followStyle = useAnimatedStyle(() => ({ opacity: follow.value }));

  return { renderedStep: rendered.step, bodyStyle, followStyle };
}
