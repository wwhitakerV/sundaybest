import { appReducer, type AppState } from "@/core/store";

/**
 * Plans made in New Plan that aren't built yet. The mock data holds none —
 * only built plans, one per mock image — so a test that needs one makes it
 * the way the app does: `plan/create` leaves a draft, and `generation/start`
 * begins building it.
 */

const AT = "2026-09-23T12:05:00.000Z";

/** Made and not yet built: a draft. */
export const DRAFT_PLAN_ID = "plan-draft";
/** Made and being built: writing its four days, with a Quick Check to come. */
export const BUILDING_PLAN_ID = "plan-being-built";
/** The working title both carry until their sermon is looked up. */
export const PENDING_PLAN_TITLE = "A new sermon";
/** How long each is. */
export const PENDING_PLAN_DAYS = 4;

function createDraft(state: AppState, planId: string): AppState {
  return appReducer(state, {
    type: "plan/create",
    planId,
    sermonId: planId.replace(/^plan-/, "sermon-"),
    sourceUrl: `https://youtube.com/watch?v=${planId}`,
    title: PENDING_PLAN_TITLE,
    lengthDays: PENDING_PLAN_DAYS,
    quickCheckEnabled: true,
    at: AT,
  });
}

/** `state` with one plan made in New Plan, still a draft (`DRAFT_PLAN_ID`). */
export function withDraftPlan(state: AppState): AppState {
  return createDraft(state, DRAFT_PLAN_ID);
}

/**
 * `state` with one plan made in New Plan and being built (`BUILDING_PLAN_ID`),
 * its build as far as writing the days.
 */
export function withPlanBeingBuilt(state: AppState): AppState {
  const started = appReducer(createDraft(state, BUILDING_PLAN_ID), {
    type: "generation/start",
    generationId: "generation-being-built",
    planId: BUILDING_PLAN_ID,
    at: AT,
  });
  return appReducer(started, { type: "generation/step", status: "writingDays", at: AT });
}
