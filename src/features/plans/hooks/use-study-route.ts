import { useLocalSearchParams } from "expo-router";

import { parseStudyParams } from "@/entities/plan";
import { getPlanById, getPlanDay, useAppSelector } from "@/core/store";

/**
 * The Daily Study session's route — `planId`, and `day` on the per-day
 * routes — checked (`parseStudyParams`), and the plan and day it points at,
 * from the store: null for either that doesn't exist, or when the params
 * aren't a plan and a day. Every screen in the session reads its context
 * from here, so it's the same plan and day however the user moves through it.
 */
export function useStudyRoute() {
  const params = parseStudyParams(useLocalSearchParams());
  const planId = params?.planId ?? "";
  const dayNumber = params?.dayNumber ?? 0;
  const plan = useAppSelector((state) => (params ? getPlanById(state, planId) : null));
  const planDay = useAppSelector((state) => (params ? getPlanDay(state, planId, dayNumber) : null));

  return { planId, dayNumber, plan, day: planDay };
}
