import { z } from "zod";

/**
 * Route objects for the plans slice, built in one place instead of by hand at
 * every call site. Pure: they only describe a destination — navigating is
 * the caller's job. Literal pathnames keep them assignable to Expo Router's
 * typed `Href` without importing the router here.
 */

type DayParam = number | string;
export type StudyRouteStep = "read" | "scripture" | "reflect" | "pray";

export function planOverviewHref(planId: string) {
  return { pathname: "/(tabs)/plans/[planId]", params: { planId } } as const;
}

export function studyHref(planId: string, day: DayParam, step?: StudyRouteStep) {
  return {
    pathname: "/study/[planId]",
    params: { planId, day: String(day), ...(step ? { step } : {}) },
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

export function planCompleteHref(planId: string) {
  return {
    pathname: "/study/[planId]/plan-complete",
    params: { planId },
  } as const;
}

export const HOME_HREF = "/(tabs)/home";
export const PLANS_HREF = "/(tabs)/plans";
export const NEW_PLAN_HREF = "/(plan-creation)/paste-sermon";

const planParamsSchema = z.object({ planId: z.string().min(1).max(64) });

const studyParamsSchema = planParamsSchema.extend({
  day: z.string().regex(/^[1-9]\d{0,2}$/),
  step: z.enum(["read", "scripture", "reflect", "pray"]).optional(),
});

export function parsePlanParams(params: unknown): { planId: string } | null {
  const parsed = planParamsSchema.safeParse(params);
  return parsed.success ? { planId: parsed.data.planId } : null;
}

export function parseStudyParams(
  params: unknown,
): { planId: string; dayNumber: number; step?: StudyRouteStep } | null {
  const parsed = studyParamsSchema.safeParse(params);
  if (!parsed.success) return null;
  return {
    planId: parsed.data.planId,
    dayNumber: Number(parsed.data.day),
    ...(parsed.data.step ? { step: parsed.data.step } : {}),
  };
}
