import { useNavigationContainerRef } from "expo-router";

import { getFocusedTab } from "@/utils/navigation/getFocusedTab";

/**
 * Reads, when called, which tab is in focus — under anything shown over the
 * tabs too — so a link can open where the reader is, as iOS does. Read at the
 * press, not at render, so it never answers for a screen that's since moved on.
 */
export function useFocusedTab(tabsRoute = "(tabs)"): () => string | null {
  // Undefined outside the router (a screen drawn on its own): then there's no tab to read.
  const navigation = useNavigationContainerRef() as
    | ReturnType<typeof useNavigationContainerRef>
    | undefined;
  return () =>
    getFocusedTab(navigation?.isReady() ? navigation.getRootState() : undefined, tabsRoute);
}
