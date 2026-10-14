import { toAppTab, type AppTab } from "./app-tab";

/**
 * Where a plan, and the Settings pages it leads to, open: in a tab's own
 * stack; in Plans' search, on top of the results (`plan-search`); or over the
 * tabs in the app's own stack, on top of Weeks (`over`) — so Back returns to
 * where the reader was.
 */
export type Place = AppTab | "plan-search" | "over";

/** The app's own routes over the tabs that are a place, by route name, and which. */
const PLACE_OF: Readonly<Record<string, Exclude<Place, AppTab>>> = {
  "plan-search": "plan-search",
  weeks: "over",
  "plan/[planId]": "over",
  "daily-reminder": "over",
  "how-plans-are-made": "over",
  "privacy-policy": "over",
  "privacy/[topic]": "over",
  "bible-translation": "over",
  "text-size": "over",
};

/** Every route that's a place: what `useFocusedPlace` looks for over the tabs. */
export const PLACE_ROUTES: readonly string[] = Object.keys(PLACE_OF);

/** A route name as the place it is — a tab, Plans' search, over the tabs — or `fallback`. */
export function toPlace(name: string | null, fallback: AppTab): Place {
  const over = name === null ? undefined : PLACE_OF[name];
  return over ?? toAppTab(name, fallback);
}
