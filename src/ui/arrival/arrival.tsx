import { createContext } from "react";

/**
 * Where a page is in its arrival after a cover lifts off it (the launch intro):
 * still covered (`waiting`), its pieces coming in (`arriving`), or no cover at
 * all (`settled`, the default — everything simply shows).
 */
export type ArrivalState = "waiting" | "arriving" | "settled";

/** Set by whatever covers the page at first; read by each piece that arrives (`Arrive`). */
export const ArrivalContext = createContext<ArrivalState>("settled");
