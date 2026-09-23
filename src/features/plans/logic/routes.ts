/**
 * Route objects for the plans slice, built in one place instead of by hand at
 * every call site. Pure: they only describe a destination — navigating is
 * the caller's job. Literal pathnames keep them assignable to Expo Router's
 * typed `Href` without importing the router here.
 */

type DayParam = number | string;

export type QuickCheckStage = "question" | "answer" | "finish-verse" | "score";

export function planOverviewHref(planId: string) {
  return { pathname: "/(tabs)/plans/[planId]", params: { planId } } as const;
}

export function studyHref(planId: string, day: DayParam) {
  return {
    pathname: "/(tabs)/plans/[planId]/study",
    params: { planId, day: String(day) },
  } as const;
}

export function dayCompleteHref(planId: string, day: DayParam) {
  return {
    pathname: "/(tabs)/plans/[planId]/day-complete",
    params: { planId, day: String(day) },
  } as const;
}

export function quickCheckHref(stage: QuickCheckStage, planId: string, day: DayParam) {
  return {
    pathname: `/(tabs)/plans/[planId]/quick-check/${stage}`,
    params: { planId, day: String(day) },
  } as const;
}
