import type { Entity, Id, IsoDateTime } from "./common";

/** What a library item points at. */
export type LibraryItemKind = "plan" | "sermon" | "scripture" | "reflection" | "prayer";

/** Something the user saved to come back to — the Plans tab's "Saved". */
export type LibraryItem = Entity & {
  userId: Id;
  kind: LibraryItemKind;
  /** The ID of the saved plan, sermon, passage, reflection, or prayer. */
  itemId: Id;
  savedAt: IsoDateTime;
  /** A note of their own, if they added one. */
  note: string | null;
};
