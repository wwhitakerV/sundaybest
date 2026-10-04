export type SermonSearchStatus = "idle" | "waiting" | "searching" | "ready" | "error";

/** Wait this long after typing stops before asking the search source. */
export const SERMON_SEARCH_DEBOUNCE_MS = 400;

/** Avoid spending a request on a one-character search. */
export const SERMON_SEARCH_MIN_CHARACTERS = 2;

/** What the search source should receive after user-input cleanup. */
export function normalizeSermonSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

/** Case-insensitive key used to suppress duplicate normalized searches. */
export function sermonSearchQueryKey(query: string): string {
  return normalizeSermonSearchQuery(query).toLocaleLowerCase();
}

/** Preserve the current result collection when a new search returns the same rows in the same order. */
export function haveSameSermonSearchResults(
  current: readonly { id: string }[],
  next: readonly { id: string }[],
): boolean {
  if (current.length !== next.length) return false;
  return current.every((result, index) => result.id === next[index]?.id);
}
