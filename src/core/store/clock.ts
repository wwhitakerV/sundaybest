import type { Id, IsoDate, IsoDateTime } from "@/types/domain";

import { STORE_TODAY } from "./state";

/**
 * The store's clock and ID source — the only impure part of the store, kept
 * out of the reducer so it stays deterministic.
 *
 * While the data is mock data, "today" is the mock's fixed date and the time
 * of day is the real one, so new records line up with the mock history.
 */

let sequence = 0;

/** A new ID for a record of `kind`: unique for the life of the app. */
export function createId(kind: string): Id {
  sequence += 1;
  return `${kind}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function getToday(): IsoDate {
  return STORE_TODAY;
}

export function getNow(): IsoDateTime {
  return `${getToday()}T${new Date().toISOString().slice(11)}`;
}
