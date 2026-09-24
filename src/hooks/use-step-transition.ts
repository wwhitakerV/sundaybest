import { useEffect, useRef, useState } from "react";
import { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const OUT_DURATION = 110;
const IN_DURATION = 150;
const REST_TRANSLATE_Y = 0;
const EXIT_TRANSLATE_Y = 8;

/** The body on screen, and how many times it has been swapped. */
type Rendered = { step: number; swaps: number };

/**
 * Cross-fades a multi-step screen's body between steps (Daily Study, Quick
 * Check, New Plan). `step` updates at once, so step indicators move immediately; the
 * returned `renderedStep` only follows once the outgoing body has faded and
 * dropped 8px over 110ms. The incoming body then fades up from 8px below over
 * 150ms. The same sequence plays forward and back, the two bodies are never
 * both at full opacity, and nothing animates on first mount. The screen's
 * header and chrome never move.
 *
 * The fade-in starts only once React has actually swapped the body in. It
 * can't start from the fade-out's completion: that runs on the UI thread, and
 * the swap reaches React a few frames later — so for those frames the
 * outgoing body would fade back in.
 */
export function useStepTransition(step: number) {
  const [rendered, setRendered] = useState<Rendered>({ step, swaps: 0 });
  const progress = useSharedValue(1);
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
      withTiming(0, { duration: OUT_DURATION }, (finished) => {
        if (finished) runOnJS(swapTo)(step);
      }),
    );
  }, [step, progress]);

  // Runs after React has committed the swapped-in body.
  useEffect(() => {
    if (rendered.swaps === lastSwap.current) return;
    lastSwap.current = rendered.swaps;
    progress.set(withTiming(1, { duration: IN_DURATION }));
  }, [rendered.swaps, progress]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: EXIT_TRANSLATE_Y - progress.value * (EXIT_TRANSLATE_Y - REST_TRANSLATE_Y) },
    ],
  }));

  return { renderedStep: rendered.step, bodyStyle };
}
