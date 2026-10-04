import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useCompleteOnboardingMutation } from "@/core/api/queries";
import { tapFeedback } from "@/core/haptics/haptics";
import { getSamplePlan, getUserPlans, useAppSelector, useStoreActions } from "@/core/store";
import { planOverviewHref } from "@/entities/plan";
import { getStartRoutes } from "../logic/start";

/** Welcome's two ways in, with onboarding persisted to the real user profile first. */
export function useWelcomeStart() {
  const router = useRouter();
  const hasPlans = useAppSelector((state) => getUserPlans(state).length > 0);
  const sample = useAppSelector(getSamplePlan);
  const { completeOnboarding: completeLocalOnboarding } = useStoreActions();
  const onboarding = useCompleteOnboardingMutation();
  const [starting, setStarting] = useState(false);
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

  async function persistOnboarding(): Promise<boolean> {
    try {
      await onboarding.mutateAsync();
      // Plans are still mock-backed in Phase 1, so keep their local store's
      // onboarding bit aligned until that store is retired in the Plans slice.
      completeLocalOnboarding();
      return true;
    } catch {
      Alert.alert("Couldn’t get started", "Make sure SundayBest can reach the API and try again.");
      return false;
    }
  }

  return {
    starting,
    start: () => {
      if (startingNow.current) return;
      startingNow.current = true;
      tapFeedback();
      setStarting(true);
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        void (async () => {
          if (!(await persistOnboarding())) {
            startingNow.current = false;
            setStarting(false);
            return;
          }
          for (const route of getStartRoutes(hasPlans)) router.push(route);
        })();
      });
    },
    seeSample: () => {
      if (!sample || startingNow.current) return;
      startingNow.current = true;
      tapFeedback();
      void (async () => {
        if (!(await persistOnboarding())) {
          startingNow.current = false;
          return;
        }
        router.push(planOverviewHref(sample.id));
      })();
    },
  };
}
