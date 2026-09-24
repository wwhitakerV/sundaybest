import { useContext, useState, type ReactNode } from "react";

import {
  HeaderArrivalContext,
  HeaderEntranceContext,
  type HeaderEntrance,
} from "./header-entrance";

export type HeaderEntranceScopeProps = {
  /** The screen's route key, as a navigator's `screenLayout` receives it. */
  routeKey: string;
  children: ReactNode;
};

type Tracked = HeaderEntrance & { seen: number | undefined };

/**
 * Wraps one screen (a navigator's `screenLayout`) and decides how its header
 * buttons come in. New buttons start their entrance by default; each time
 * `HeaderArrivalProvider` reports an arrival at this screen, they come in
 * afresh — animated, or just there for a switch between tab roots. That
 * report lands before the screen is drawn, inside the entrance's opening
 * delay, so a cancelled entrance never shows. Arrivals elsewhere leave it be.
 */
export function HeaderEntranceScope({ routeKey, children }: HeaderEntranceScopeProps) {
  const arrival = useContext(HeaderArrivalContext);
  const [tracked, setTracked] = useState<Tracked>({ seen: undefined, arrivals: 0, animate: true });
  // A new arrival here: adjusted during render, React's way of updating
  // state from what came before.
  if (arrival.routeKey === routeKey && arrival.count !== tracked.seen) {
    setTracked({ seen: arrival.count, arrivals: tracked.arrivals + 1, animate: arrival.animate });
  }

  return (
    <HeaderEntranceContext.Provider
      value={{ arrivals: tracked.arrivals, animate: tracked.animate }}
    >
      {children}
    </HeaderEntranceContext.Provider>
  );
}

/** A navigator's `screenLayout` that puts each of its screens in a `HeaderEntranceScope`. */
export function headerEntranceLayout({
  route,
  children,
}: {
  route: { key: string };
  children: ReactNode;
}) {
  return <HeaderEntranceScope routeKey={route.key}>{children}</HeaderEntranceScope>;
}
