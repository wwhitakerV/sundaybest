import { useState, type ReactNode } from "react";
import { useNavigationContainerRef } from "expo-router";
import { useNavigationState } from "expo-router/react-navigation";

import { getFocusedRoute, type FocusedRoute } from "@/utils/navigation/getFocusedRoute";
import { shouldAnimateHeaderArrival } from "@/utils/navigation/shouldAnimateHeaderArrival";
import { HeaderArrivalContext, type HeaderArrival } from "./header-entrance";

export type HeaderArrivalProviderProps = {
  /** The tab bar's root screens, by route path ("(tabs)/home/index"). */
  tabRoots: readonly string[];
  children: ReactNode;
};

type Tracked = { at: FocusedRoute | undefined; arrival: HeaderArrival };

/**
 * Watches which screen the app is showing and reports each arrival — the
 * screen now in focus, and whether its header buttons animate in
 * (`shouldAnimateHeaderArrival`). Each screen's `HeaderEntranceScope` acts on
 * arrivals at itself. Mount once, in the root layout.
 */
export function HeaderArrivalProvider({ tabRoots, children }: HeaderArrivalProviderProps) {
  const container = useNavigationContainerRef();
  // Re-renders on every navigation change, before the screen is drawn. The
  // state it hands over can lag inside nested navigators, so the screen in
  // focus is read from the container, which holds all of it.
  useNavigationState((state) => state);
  const root = container.isReady() ? container.getRootState() : undefined;
  // Expo Router wraps the app's own navigators in one internal root route
  // (`__root`); paths start below it, as the app names them.
  const focused = getFocusedRoute(root?.routes[root.index]?.state);
  const [tracked, setTracked] = useState<Tracked>({
    at: undefined,
    arrival: { routeKey: undefined, count: 0, animate: false },
  });

  // A new screen in focus: adjusted during render, React's way of updating
  // state from what came before.
  if (focused !== undefined && focused.key !== tracked.at?.key) {
    setTracked({
      at: focused,
      arrival: {
        routeKey: focused.key,
        count: tracked.arrival.count + 1,
        animate: shouldAnimateHeaderArrival({ from: tracked.at, to: focused, tabRoots }),
      },
    });
  }

  return (
    <HeaderArrivalContext.Provider value={tracked.arrival}>
      {children}
    </HeaderArrivalContext.Provider>
  );
}
