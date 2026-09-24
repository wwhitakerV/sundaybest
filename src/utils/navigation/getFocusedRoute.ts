/** Navigation state as far as this needs it — full or partial, any navigator. */
type NavigationStateLike = {
  index?: number;
  routes: readonly { key?: string; name: string; state?: NavigationStateLike }[];
};

/** The screen in focus: its route key, and the route names down to it ("(tabs)/home/index"). */
export type FocusedRoute = { key: string; path: string };

/**
 * The screen the app is showing: follows the focused route down through every
 * nested navigator to the innermost one. A navigator that hasn't been opened
 * yet ends the search at its own route.
 */
export function getFocusedRoute(state: NavigationStateLike | undefined): FocusedRoute | undefined {
  const names: string[] = [];
  let current = state;
  let key: string | undefined;
  while (current) {
    const route = current.routes[current.index ?? 0];
    if (!route) return undefined;
    names.push(route.name);
    key = route.key;
    current = route.state;
  }
  return key === undefined ? undefined : { key, path: names.join("/") };
}
