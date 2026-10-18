import { createContext } from "react";
import type { SharedValue } from "react-native-reanimated";

/**
 * Where a page is in its arrival after a cover lifts off it (the launch intro):
 * still covered (`waiting`), its pieces coming in (`arriving`), or no cover at
 * all (`settled`, the default — everything simply shows).
 */
export type ArrivalState = "waiting" | "arriving" | "settled";

/** Set by whatever covers the page at first; read by each piece that arrives (`Arrive`). */
export const ArrivalContext = createContext<ArrivalState>("settled");

/** How far down a cover lifting from the top has uncovered the page before it starts: nowhere. */
export const COVERED = -1e6;

/**
 * Set by a cover that lifts off the page from the top down (the water intro's
 * drain): how far down the screen it has uncovered the page, in points, on the
 * UI thread. Each waiting piece arrives as the cover's edge passes it, instead
 * of in a cascade once the cover has gone. Without it, they cascade.
 */
export const ArrivalLineContext = createContext<SharedValue<number> | null>(null);

/** How far down the page is uncovered once the cover has gone: past everything. */
export const UNCOVERED = 1e6;
