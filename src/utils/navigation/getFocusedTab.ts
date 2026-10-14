import { getFocusedPlace } from "./getFocusedPlace";

/** Navigation state as far as this needs it — full or partial, any navigator. */
type NavigationStateLike = Parameters<typeof getFocusedPlace>[0];

/**
 * The tab in focus, by its route name — under anything shown over the tabs
 * too (a modal, a full-screen list), since the tabs stay where they were.
 * Looks down through the navigators in focus (the router's own root first)
 * for the tabs. Null before the tabs are there (Welcome) or when nothing
 * says which is open.
 */
export function getFocusedTab(state: NavigationStateLike, tabsRoute: string): string | null {
  return getFocusedPlace(state, tabsRoute, []);
}
