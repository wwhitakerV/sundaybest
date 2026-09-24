import { useLocalSearchParams } from "expo-router";

import { getPlanById, getPlanDay, useAppSelector } from "@/core/store";

/**
 * The Daily Study session's route — `planId`, and `day` on the per-day
 * routes — and the plan and day it points at, from the store (null for
 * either that doesn't exist). Every screen in the session reads its context
 * from here, so it's the same plan and day however the user moves through it.
 */
export function useStudyRoute() {
  const { planId = "", day = "" } = useLocalSearchParams<{ planId: string; day: string }>();
  const dayNumber = Number(day);
  const plan = useAppSelector((state) => getPlanById(state, planId));
  const planDay = useAppSelector((state) => getPlanDay(state, planId, dayNumber));

  return { planId, dayNumber, plan, day: planDay };
}
