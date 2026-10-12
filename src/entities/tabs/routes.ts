import type { AppTab } from "./logic/app-tab";

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
