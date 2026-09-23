import { useEffect, useRef, useState } from "react";
import { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const OUT_DURATION = 110;
const IN_DURATION = 150;
const REST_TRANSLATE_Y = 0;
const EXIT_TRANSLATE_Y = 8;

/**
 * Cross-fades the Daily Study body between steps. `step` updates at once
 * (so the step indicators move immediately); the returned `renderedStep`
 * only follows once the outgoing body has faded and dropped 8px over
 * 110ms. The incoming body then fades up from 8px below over 150ms. The
 * same sequence plays forward and back, and the two bodies are never both
 * at full opacity. Nothing animates on first mount.
 */
export function useStudyStepTransition(step: number) {
  const [renderedStep, setRenderedStep] = useState(step);
  const progress = useSharedValue(1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // The completion callback runs as a worklet on the UI thread, so the
    // React state setter has to hop back to JS through `runOnJS` — calling it
    // directly crashes on device. Reassigning `progress.value` from the same
    // worklet is the normal way to chain the fade-in.
    progress.value = withTiming(0, { duration: OUT_DURATION }, (finished) => {
      if (!finished) return;
      runOnJS(setRenderedStep)(step);
      progress.value = withTiming(1, { duration: IN_DURATION });
    });
  }, [step, progress]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: EXIT_TRANSLATE_Y - progress.value * (EXIT_TRANSLATE_Y - REST_TRANSLATE_Y) },
    ],
  }));

  return { renderedStep, bodyStyle };
}
