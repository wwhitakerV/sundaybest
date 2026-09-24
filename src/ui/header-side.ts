import { createContext, useContext } from "react";

/** Which edge of a header something sits at: the left slot, or the right. */
export type HeaderSide = "leading" | "trailing";

/**
 * Set by a header around each of its slots. Outside one — a tab root's
 * actions, Home's masthead — it's the right side, where those sit.
 */
export const HeaderSideContext = createContext<HeaderSide>("trailing");

/** The side of the header this is on, for motion that runs from that edge. */
export function useHeaderSide(): HeaderSide {
  return useContext(HeaderSideContext);
}
