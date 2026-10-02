import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";

import { planOverviewHref } from "@/entities/plan";
import { tapFeedback } from "@/core/haptics/haptics";
import { getSamplePlan, getUserPlans, useAppSelector } from "@/core/store";
import { getStartRoutes } from "../logic/start";

/**
 * Welcome's two ways in: Get a plan now — Home, and for someone with no
 * plans yet, straight on to paste a sermon — and See a sample plan.
 *
 * Opening Home takes a moment, so Get a plan now shows it's under way
 * (`starting`) at once and only moves on a frame later, once its spinner is
 * drawn; a second press meanwhile does nothing. Leaving the screen resets it.
 */
export function useWelcomeStart() {
  const router = useRouter();
  const hasPlans = useAppSelector((state) => getUserPlans(state).length > 0);
  const sample = useAppSelector(getSamplePlan);
  const [starting, setStarting] = useState(false);
  // Read synchronously, so two presses in one frame still go once.
  const startingNow = useRef(false);
  const frame = useRef<number | null>(null);

  useFocusEffect(
    useCallback(
      () => () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        startingNow.current = false;
        setStarting(false);
      },
      [],
    ),
  );

  return {
    starting,
    start: () => {
      if (startingNow.current) return;
      startingNow.current = true;
      tapFeedback();
      setStarting(true);
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        for (const route of getStartRoutes(hasPlans)) router.push(route);
      });
    },
    seeSample: () => {
      if (sample) router.push(planOverviewHref(sample.id));
    },
  };
}
