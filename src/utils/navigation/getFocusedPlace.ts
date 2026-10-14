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
 * Where the reader is, for a link that opens a page there: the nearest of
 * `places` (screens over the tabs with pages of their own) or the tab open
 * in the tabs — under anything else shown over them (a modal, a sheet),
 * since that has no pages of its own. Looks down through the navigators in
 * focus (the router's own root first), and down each from its top. Null
 * before the tabs are there (Welcome) or when nothing says which is open.
 */
export function getFocusedPlace(
  state: NavigationStateLike | undefined,
  tabsRoute: string,
  places: readonly string[],
): string | null {
  let current = state;
  while (current) {
    const top = current.index ?? current.routes.length - 1;
    for (let at = top; at >= 0; at -= 1) {
      const route = current.routes[at];
      if (!route) continue;
      if (places.includes(route.name)) return route.name;
      if (route.name === tabsRoute) return openTab(route);
    }
    current = current.routes[top]?.state;
  }
  return null;
}

/** The tab open in the tabs: from their own state, or, not drawn yet, the one they're opening on. */
function openTab(tabs: NavigationStateLike["routes"][number]): string | null {
  if (tabs.state) return tabs.state.routes[tabs.state.index ?? 0]?.name ?? null;
  const screen = (tabs.params as { screen?: unknown } | undefined)?.screen;
  return typeof screen === "string" ? screen : null;
}
