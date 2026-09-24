import { useEffect } from "react";

import {
  getPlanById,
  getPlanGeneration,
  getUserSettings,
  useAppSelector,
  useStoreActions,
} from "@/core/store";

import { buildMockPlanContent } from "./build-plan-content";
import { getNextBuildMove } from "./build-steps";
import { lookUpMockSermon } from "./sermon-catalog";

/** How long each stage of a mock build takes. */
export const BUILD_STAGE_MS = 1_100;

/**
 * Builds plans — in the frontend, for now. Mounted once, app-wide, so a
 * build carries on when the user leaves Preparing. Whenever a build is under
 * way it waits a stage's time, then moves it on through the store's actions:
 * the next stage, a failure (for the test links that fail), or — at the end —
 * the finished plan, with its days, Scripture, readings, reflections,
 * prayers, and Quick Checks.
 *
 * Deterministic: the same link, length, and attempt always build the same
 * way. Renders nothing.
 */
export function PlanBuilder() {
  const generation = useAppSelector(getPlanGeneration);
  const plan = useAppSelector((state) =>
    generation?.planId ? getPlanById(state, generation.planId) : null,
  );
  const translation = useAppSelector((state) => getUserSettings(state).bibleTranslation);
  const { updateGenerationStep, failPlanGeneration, completePlanGeneration } = useStoreActions();

  useEffect(() => {
    if (!generation || !plan) return;
    const move = getNextBuildMove(generation, plan.quickCheckEnabled);
    if (!move) return;

    const timer = setTimeout(() => {
      if (move.type === "step") updateGenerationStep(move.status);
      else if (move.type === "fail") failPlanGeneration(move.error);
      else {
        completePlanGeneration(
          buildMockPlanContent({
            plan,
            sermon: lookUpMockSermon(generation.sourceUrl),
            translation,
            at: new Date().toISOString(),
          }),
        );
      }
    }, BUILD_STAGE_MS);
    return () => clearTimeout(timer);
  }, [
    generation,
    plan,
    translation,
    updateGenerationStep,
    failPlanGeneration,
    completePlanGeneration,
  ]);

  return null;
}
