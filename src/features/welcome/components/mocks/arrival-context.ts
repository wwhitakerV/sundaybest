import { createContext } from "react";

/**
 * Whether the mock screen around it is arriving by sliding in (a push or a
 * modal). Its content mounts in place then — the slide already brings it in —
 * while content that appears later, a new step's page, still rises in.
 */
export const ArrivalContext = createContext(false);
