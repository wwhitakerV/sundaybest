/** Navigation state as far as this needs it — full or partial, any navigator. */
type NavigationStateLike = {
  index?: number;
  routes: readonly {
    name: string;
    params?: object | undefined;
    state?: NavigationStateLike;
  }[];
};

/**
 * The tab in focus, by its route name — under anything shown over the tabs
 * too (a modal, a full-screen list), since the tabs stay where they were.
 * Looks down through the navigators in focus (the router's own root first)
 * for the tabs. Null before the tabs are there (Welcome) or when nothing
 * says which is open.
 */
export function getFocusedTab(
  state: NavigationStateLike | undefined,
  tabsRoute: string,
): string | null {
  let current = state;
  while (current) {
    const tabs = current.routes.findLast((route) => route.name === tabsRoute);
    if (tabs) return openTab(tabs);
    current = current.routes[current.index ?? 0]?.state;
  }
  return null;
}

/** The tab open in the tabs: from their own state, or, not drawn yet, the one they're opening on. */
function openTab(tabs: NavigationStateLike["routes"][number]): string | null {
  if (tabs.state) return tabs.state.routes[tabs.state.index ?? 0]?.name ?? null;
  const screen = (tabs.params as { screen?: unknown } | undefined)?.screen;
  return typeof screen === "string" ? screen : null;
}
