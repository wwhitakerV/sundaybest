import type { AppTab } from "./logic/app-tab";
import type { Place } from "./logic/place";

/**
 * Pages that open inside whichever tab they're opened from, as iOS does: a
 * plan opened from Home stays in Home, a setting opened from a plan stays over
 * the plan, and Back returns to where the reader was. Every tab's stack has
 * its own copy of each route (`src/app/(tabs)/<tab>/`). Pure: these only
 * describe a destination.
 */

/** Settings' pages that a plan's More menu, and the pages it leads to, can open. */
export type TabPage =
  "daily-reminder" | "how-plans-are-made" | "privacy-policy" | "bible-translation" | "text-size";

/** A plan's overview, in `tab`. */
export function tabPlanHref(tab: AppTab, planId: string) {
  return { pathname: `/(tabs)/${tab}/[planId]`, params: { planId } } as const;
}

/** One of Settings' shared pages, in `tab`. */
export function tabPageHref(tab: AppTab, page: TabPage) {
  return `/(tabs)/${tab}/${page}` as const;
}

/** A privacy topic's page, in `tab`. */
export function tabPrivacyTopicHref(tab: AppTab, topic: string) {
  return { pathname: `/(tabs)/${tab}/privacy/[topic]`, params: { topic } } as const;
}

/** Where a place's own pages sit: a tab's folder, Plans' search's, or the app's top. */
const ROOT_OF = {
  "plan-search": "/plan-search",
  over: "",
} as const;

function rootOf(place: Place) {
  return place === "plan-search" || place === "over"
    ? ROOT_OF[place]
    : (`/(tabs)/${place}` as const);
}

/** A plan's overview, where the reader is — on top of Weeks, it's `/plan/[planId]`. */
export function placePlanHref(place: Place, planId: string) {
  const params = { planId };
  if (place === "over") return { pathname: "/plan/[planId]", params } as const;
  if (place === "plan-search") return { pathname: "/plan-search/[planId]", params } as const;
  return tabPlanHref(place, planId);
}

/** One of Settings' shared pages, where the reader is. */
export function placePageHref(place: Place, page: TabPage) {
  return `${rootOf(place)}/${page}` as const;
}

/** A privacy topic's page, where the reader is. */
export function placePrivacyTopicHref(place: Place, topic: string) {
  return { pathname: `${rootOf(place)}/privacy/[topic]`, params: { topic } } as const;
}
