import { createContext, useContext } from "react";

/**
 * The app's latest arrival: the screen now in focus, a count that moves with
 * every arrival, and whether that screen's header buttons animate in. Set
 * once for the app by `HeaderArrivalProvider`.
 */
export type HeaderArrival = { routeKey: string | undefined; count: number; animate: boolean };

export const HeaderArrivalContext = createContext<HeaderArrival>({
  routeKey: undefined,
  count: 0,
  animate: false,
});

/**
 * How this screen's header buttons come in: `arrivals` moves each time the
 * screen is arrived at (the buttons come in afresh), and `animate` says
 * whether they play their entrance. Set per screen by `HeaderEntranceScope`.
 */
export type HeaderEntrance = { arrivals: number; animate: boolean };

/** Outside any screen, a header button simply animates in as it appears. */
export const HeaderEntranceContext = createContext<HeaderEntrance>({ arrivals: 0, animate: true });

export function useHeaderEntrance(): HeaderEntrance {
  return useContext(HeaderEntranceContext);
}
