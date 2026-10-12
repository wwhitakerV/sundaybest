import { useIsFocused } from "expo-router";

import { useTabBarHidden } from "./tab-bar-accessory";

/** The stack that holds the tabs, as far as this needs it. */
type StackStateLike = { index?: number; routes: readonly { name: string }[] };

/** The navigation the tab bar is handed, as far as this needs it: the stack above the tabs. */
type TabsNavigationLike = { getParent?: () => { getState: () => StackStateLike } | undefined };

/** Whether what covers the tabs is one of `sheets` — a half sheet the bar stays under. */
export function isUnderSheet(
  state: StackStateLike | undefined,
  sheets: readonly string[],
): boolean {
  const top = state?.routes[state.index ?? 0];
  return top !== undefined && sheets.includes(top.name);
}

/**
 * Whether the tab bar is shown: while the tabs are focused, unless the page on
 * top has asked it away — and under a half sheet too (`sheets`), as iOS keeps
 * its tab bar under one, so it's already there the moment the sheet slides away.
 * Anything else over the tabs (a full-screen page, a modal) takes it away.
 */
export function useTabBarShown(navigation: TabsNavigationLike, sheets: readonly string[]) {
  // Rendered by the tab navigator itself, outside any tab's screen, so this is
  // whether the whole `(tabs)` route is focused in the root stack.
  const isFocused = useIsFocused();
  const askedAway = useTabBarHidden();
  const underSheet = !isFocused && isUnderSheet(navigation.getParent?.()?.getState(), sheets);
  return (isFocused || underSheet) && !askedAway;
}
