import type { Id, LibraryItem, LibraryItemKind, Plan } from "@/types/domain";

import { compareIso } from "../dates";
import type { AppState } from "../state";
import { findById, listAll } from "../table";

/** Everything saved, most recently saved first. */
export function getLibraryItems(state: AppState): LibraryItem[] {
  return listAll(state.library).sort((a, b) => compareIso(b.savedAt, a.savedAt));
}

export function getLibraryItem(
  state: AppState,
  kind: LibraryItemKind,
  itemId: Id,
): LibraryItem | null {
  return (
    listAll(state.library).find((item) => item.kind === kind && item.itemId === itemId) ?? null
  );
}

export function isSaved(state: AppState, kind: LibraryItemKind, itemId: Id): boolean {
  return getLibraryItem(state, kind, itemId) !== null;
}

/** Saved plans — the Plans tab's "Saved" — most recently saved first. */
export function getLibraryPlans(state: AppState): Plan[] {
  return getLibraryItems(state).flatMap((item) => {
    const plan = item.kind === "plan" ? findById(state.plans, item.itemId) : null;
    return plan ? [plan] : [];
  });
}
