import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useCompleteOnboardingMutation } from "@/core/api/reader-queries";
import { usePlansQuery } from "@/core/api/plan-queries";
import { tapFeedback } from "@/core/haptics/haptics";
import { planOverviewHref } from "@/entities/plan";
import { getApiSamplePlan, getApiUserPlans } from "@/features/plans";
import { getStartRoutes } from "../logic/start";

/** Welcome's two ways in, backed entirely by the real API plan/user state. */
export function useWelcomeStart() {
  const router = useRouter();
  const plansQuery = usePlansQuery();
  const allPlans = plansQuery.data?.plans ?? [];
  const hasPlans = getApiUserPlans(allPlans).length > 0;
  const sample = getApiSamplePlan(allPlans);
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
