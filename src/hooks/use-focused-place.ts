import { useNavigationContainerRef } from "expo-router";

import { getFocusedPlace } from "@/utils/navigation/getFocusedPlace";

/**
 * Reads, when called, where the reader is — the nearest of `places` (screens
 * over the tabs with pages of their own), or else the tab in focus — so a
 * link can open there, as iOS does. Read at the press, not at render, so it
 * never answers for a screen that's since moved on.
 */
export function useFocusedPlace(
  places: readonly string[],
  tabsRoute = "(tabs)",
): () => string | null {
  // Undefined outside the router (a screen drawn on its own): then there's nowhere to read.
  const navigation = useNavigationContainerRef() as
    ReturnType<typeof useNavigationContainerRef> | undefined;
  return () =>
    getFocusedPlace(
      navigation?.isReady() ? navigation.getRootState() : undefined,
      tabsRoute,
      places,
    );
}
