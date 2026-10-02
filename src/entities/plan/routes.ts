import { z } from "zod";

/**
 * Route objects for the plans slice, built in one place instead of by hand at
 * every call site. Pure: they only describe a destination — navigating is
 * the caller's job. Literal pathnames keep them assignable to Expo Router's
 * typed `Href` without importing the router here.
 *
 * `/study/...` is the Daily Study session: a full-screen modal with its own
 * stack (see `src/app/_layout.tsx`).
 */

type DayParam = number | string;

export function planOverviewHref(planId: string) {
  return { pathname: "/(tabs)/plans/[planId]", params: { planId } } as const;
}

export function studyHref(planId: string, day: DayParam) {
  return {
    pathname: "/study/[planId]",
    params: { planId, day: String(day) },
  } as const;
}

export function dayCompleteHref(planId: string, day: DayParam) {
  return {
    pathname: "/study/[planId]/day-complete",
    params: { planId, day: String(day) },
  } as const;
}

export function quickCheckHref(planId: string, day: DayParam) {
  return {
    pathname: "/study/[planId]/quick-check",
    params: { planId, day: String(day) },
  } as const;
}

/** The Home tab: where a plan's journey starts, and where leaving one lands. */
export const HOME_HREF = "/(tabs)/home";

/** New Plan's first step: where the tab bar's +, Home's start card, and a finished plan go. */
export const NEW_PLAN_HREF = "/(plan-creation)/paste-sermon";

/** A plan's route param: a plan ID, not empty, and no longer than any ID the app makes. */
const planParamsSchema = z.object({ planId: z.string().min(1).max(64) });

/** A study route's params: the plan, and its day as a whole number from 1. */
const studyParamsSchema = planParamsSchema.extend({
  // A whole day number from 1, at most three digits: no plan runs longer.
  day: z.string().regex(/^[1-9]\d{0,2}$/),
});

/**
 * A plan screen's route params, checked — route params are untrusted input
 * (a deep link can carry anything). Null when they aren't a plan.
 */
export function parsePlanParams(params: unknown): { planId: string } | null {
  const parsed = planParamsSchema.safeParse(params);
  return parsed.success ? { planId: parsed.data.planId } : null;
}

/** A study screen's route params, checked: the plan and the day. Null when they aren't. */
export function parseStudyParams(params: unknown): { planId: string; dayNumber: number } | null {
  const parsed = studyParamsSchema.safeParse(params);
  return parsed.success ? { planId: parsed.data.planId, dayNumber: Number(parsed.data.day) } : null;
}
