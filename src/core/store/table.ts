import type { EntityTable, Id } from "@/types/domain";

/** The record with `id`, or null — only the table's own records, never inherited keys. */
export function findById<T extends { id: Id }>(table: EntityTable<T>, id: Id): T | null {
  if (!Object.hasOwn(table, id)) return null;
  // Safe: `id` is one of the table's own keys, checked just above.
  // eslint-disable-next-line security/detect-object-injection
  return table[id] ?? null;
}

/** Every record in a table. */
export function listAll<T extends { id: Id }>(table: EntityTable<T>): T[] {
  return Object.values(table);
}

/** The table with `record` added, or replacing the one with its ID. */
export function withRecord<T extends { id: Id }>(table: EntityTable<T>, record: T): EntityTable<T> {
  return { ...table, [record.id]: record };
}

/** The table without the record with `id`. */
export function withoutRecord<T extends { id: Id }>(table: EntityTable<T>, id: Id): EntityTable<T> {
  return Object.fromEntries(Object.entries(table).filter(([key]) => key !== id));
}
