import type { Id, IsoDate, IsoDateTime } from "@/types/domain";

/**
 * The app's local clock and ID source — the only impure part of the legacy
 * store. Server-owned plan pacing uses the device timezone through the API;
 * legacy selectors use the same real local calendar date so the two layers do
 * not disagree while migration is in progress.
 */
let sequence = 0;

/** A new ID for a record of `kind`: unique for the life of the app. */
export function createId(kind: string): Id {
  sequence += 1;
  return `${kind}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function getToday(): IsoDate {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNow(): IsoDateTime {
  return new Date().toISOString();
}
