/** A tab: the stack inside it once that's been written back, or the page it was opened on. */
type TabRouteLike = {
  key: string;
  name: string;
  params?: object | undefined;
  state?: { routes: readonly { name: string }[] };
};

/** The tab navigator's state, as far as this needs it. */
type TabsStateLike = { key: string; routes: readonly TabRouteLike[] };

/** Every tab's stack starts on its `index` page (each tab layout's `anchor`). */
const FIRST_PAGE = "index";

/** The page at the bottom of a tab's stack, if it's been opened. */
function bottomPage(tab: TabRouteLike): string | undefined {
  if (tab.state) return tab.state.routes[0]?.name;
  // Opened, but its stack not written back yet: it holds the page it was opened
  // on — over its first page only if the link asked for that (`initial: false`).
  const { screen, initial } = (tab.params ?? {}) as { screen?: unknown; initial?: unknown };
  if (typeof screen !== "string") return undefined;
  return initial === false ? FIRST_PAGE : screen;
}

/**
 * The action that puts a tab back on its first page when the page at the
 * bottom of its stack isn't it — what a link that didn't ask for the first page
 * underneath leaves. Null when the stack starts where it should: then iOS's own
 * pop to the top, on a second tap, does the rest.
 */
export function stackRootReset(tabs: TabsStateLike, tabKey: string) {
  const tab = tabs.routes.find((route) => route.key === tabKey);
  const bottom = tab && bottomPage(tab);
  if (!tab || bottom === undefined || bottom === FIRST_PAGE) return null;
  const fresh = { key: tab.key, name: tab.name, state: { routes: [{ name: FIRST_PAGE }] } };
  return {
    type: "RESET",
    target: tabs.key,
    payload: { ...tabs, routes: tabs.routes.map((route) => (route === tab ? fresh : route)) },
  } as const;
}
