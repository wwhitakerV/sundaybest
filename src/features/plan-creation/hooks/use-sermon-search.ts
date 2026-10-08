import { useCallback, useEffect, useRef, useState } from "react";

import { useSundayBestApi } from "@/core/api/ApiProvider";
import { toSermonSearchResult, type SermonSearchResult } from "../data/search-sermons";
import {
  haveSameSermonSearchResults,
  normalizeSermonSearchQuery,
  SERMON_SEARCH_DEBOUNCE_MS,
  SERMON_SEARCH_MIN_CHARACTERS,
  sermonSearchQueryKey,
  type SermonSearchStatus,
} from "../logic/sermon-search";

type Rows = readonly SermonSearchResult[];

type SearchState = {
  /** The rows on screen, kept while a new search waits or runs. */
  shown: Rows;
  /** The last search that answered, by its key: reused for the same words. */
  completed: { key: string; results: Rows } | null;
  /** The search out now, or the one that failed, by its key. */
  pending: { key: string; status: "searching" | "error" } | null;
};

const NO_ROWS: Rows = [];
const NOTHING_YET: SearchState = { shown: NO_ROWS, completed: null, pending: null };

/** The same rows, if a search found the same sermons in the same order, so nothing re-renders. */
const keepSame = (current: Rows, next: Rows): Rows =>
  haveSameSermonSearchResults(current, next) ? current : next;

/**
 * Search timing and presentation state for the real SundayBest sermon API.
 * Existing rows stay mounted while a new query is in flight so typing never
 * blanks the results area between requests.
 *
 * What the reader sees — idle, waiting, a reused result — is worked out from
 * the query as it renders; the effect only times the search.
 */
export function useSermonSearch(query: string, enabled: boolean) {
  const api = useSundayBestApi();
  const [state, setState] = useState<SearchState>(NOTHING_YET);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const inFlightKeyRef = useRef<string | null>(null);

  const normalized = normalizeSermonSearchQuery(query);
  const key = sermonSearchQueryKey(normalized);
  const tooShort = normalized.length < SERMON_SEARCH_MIN_CHARACTERS;
  const completedKey = state.completed?.key ?? null;

  const view: { results: Rows; status: SermonSearchStatus } =
    !enabled || tooShort
      ? { results: NO_ROWS, status: "idle" }
      : state.completed && completedKey === key
        ? { results: keepSame(state.shown, state.completed.results), status: "ready" }
        : state.pending?.key === key
          ? { results: state.shown, status: state.pending.status }
          : { results: state.shown, status: "waiting" };

  // Words too short forget the last search; switched off only clears the rows.
  const forget = enabled && tooShort && state.completed !== null;
  if (view.results !== state.shown || forget) {
    setState({
      ...state,
      shown: view.results,
      completed: forget ? null : state.completed,
    });
  }

  const runSearch = useCallback(
    async (words: string, searchKey: string) => {
      if (searchKey === inFlightKeyRef.current) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      inFlightKeyRef.current = searchKey;
      setState((current) => ({ ...current, pending: { key: searchKey, status: "searching" } }));

      try {
        const response = await api.sermons.search(words);
        if (requestId !== requestIdRef.current) return;

        inFlightKeyRef.current = null;
        const results = response.sermons.map(toSermonSearchResult);
        setState((current) => {
          const rows = keepSame(current.shown, results);
          return { shown: rows, completed: { key: searchKey, results: rows }, pending: null };
        });
      } catch {
        if (requestId !== requestIdRef.current) return;
        inFlightKeyRef.current = null;
        setState((current) => ({ ...current, pending: { key: searchKey, status: "error" } }));
      }
    },
    [api],
  );

  const searchable = enabled && !tooShort && key !== completedKey;

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Any change makes a search already out stale.
    requestIdRef.current += 1;
    inFlightKeyRef.current = null;

    if (!searchable) return;

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void runSearch(normalized, key);
    }, SERMON_SEARCH_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // `query` too, not just its key: any keystroke restarts the wait, as typing should.
  }, [query, searchable, normalized, key, runSearch]);

  const submit = useCallback(() => {
    if (!enabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (searchable) void runSearch(normalized, key);
  }, [enabled, searchable, normalized, key, runSearch]);

  return {
    results: view.results,
    status: view.status,
    submit,
  };
}
