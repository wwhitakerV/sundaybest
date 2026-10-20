import { createContext, useContext, type ReactNode } from "react";

const OverlayContext = createContext<ReactNode>(null);

/** Hands the status bar to whatever draws over the page in a `Modal`. */
export function StatusBarOverlayProvider({
  bar,
  children,
}: {
  bar: ReactNode;
  children: ReactNode;
}) {
  return <OverlayContext.Provider value={bar}>{children}</OverlayContext.Provider>;
}

/**
 * The status bar, for a sheet or popover drawn in a `Modal` to put on top:
 * a `Modal` covers the page and the bar with it, where iOS's own bar stays
 * over everything. Nothing outside the app's frame.
 */
export function useStatusBarOverlay(): ReactNode {
  return useContext(OverlayContext);
}
