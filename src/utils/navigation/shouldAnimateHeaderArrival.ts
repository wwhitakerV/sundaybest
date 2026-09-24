import type { FocusedRoute } from "./getFocusedRoute";

export type HeaderArrivalInput = {
  /** The screen that was in focus, if any. */
  from: FocusedRoute | undefined;
  /** The screen now in focus. */
  to: FocusedRoute;
  /** The tab bar's root screens, by route path. */
  tabRoots: readonly string[];
};

/**
 * Whether a screen's header buttons animate in as the app arrives at it.
 * Always, except between two tab roots — switching tabs is instant, like
 * iOS's own tab bar. So a tab root animates when it's arrived at from any
 * other screen (Welcome, Settings, Plan Detail, a closing modal), and so does
 * the first screen there's any record of.
 */
export function shouldAnimateHeaderArrival({ from, to, tabRoots }: HeaderArrivalInput): boolean {
  if (from === undefined) return true;
  return !(tabRoots.includes(from.path) && tabRoots.includes(to.path));
}
