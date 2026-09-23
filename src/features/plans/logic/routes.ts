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
