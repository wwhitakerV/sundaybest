import { useCallback, useEffect, useRef, useState } from "react";

import { searchSermons, type SermonSearchResult } from "../data/search-sermons";
import {
  normalizeSermonSearchQuery,
  SERMON_SEARCH_DEBOUNCE_MS,
  SERMON_SEARCH_MIN_CHARACTERS,
  sermonSearchQueryKey,
  type SermonSearchStatus,
} from "../logic/sermon-search";

type SermonSearchState = {
  results: readonly SermonSearchResult[];
  status: SermonSearchStatus;
};

/**
 * Owns search timing only: debounce while typing, immediate submit from the
 * keyboard, duplicate suppression, and stale-response protection. The search
 * source itself stays in data/search-sermons so Supadata can replace it later.
 */
export function useSermonSearch(query: string, enabled: boolean) {
  const [search, setSearch] = useState<SermonSearchState>({ results: [], status: "idle" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const inFlightKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string | null>(null);
  const completedResultsRef = useRef<readonly SermonSearchResult[]>([]);

  const runSearch = useCallback(async (rawQuery: string) => {
    const normalized = normalizeSermonSearchQuery(rawQuery);
    const key = sermonSearchQueryKey(normalized);

    if (normalized.length < SERMON_SEARCH_MIN_CHARACTERS) {
      requestIdRef.current += 1;
      inFlightKeyRef.current = null;
      completedKeyRef.current = null;
      completedResultsRef.current = [];
      setSearch({ results: [], status: "idle" });
      return;
    }

    if (key === inFlightKeyRef.current) return;
    if (key === completedKeyRef.current) {
      setSearch({ results: completedResultsRef.current, status: "ready" });
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    inFlightKeyRef.current = key;
    setSearch({ results: [], status: "searching" });

    try {
      const results = await searchSermons(normalized);
      if (requestId !== requestIdRef.current) return;

      inFlightKeyRef.current = null;
      completedKeyRef.current = key;
      completedResultsRef.current = results;
      setSearch({ results, status: "ready" });
    } catch {
      if (requestId !== requestIdRef.current) return;

      inFlightKeyRef.current = null;
      setSearch({ results: [], status: "error" });
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!enabled) {
      requestIdRef.current += 1;
      inFlightKeyRef.current = null;
      setSearch({ results: [], status: "idle" });
      return;
    }

    const normalized = normalizeSermonSearchQuery(query);
    const key = sermonSearchQueryKey(normalized);

    // A changed query invalidates any older response immediately.
    requestIdRef.current += 1;
    inFlightKeyRef.current = null;

    if (normalized.length < SERMON_SEARCH_MIN_CHARACTERS) {
      completedKeyRef.current = null;
      completedResultsRef.current = [];
      setSearch({ results: [], status: "idle" });
      return;
    }

    if (key === completedKeyRef.current) {
      setSearch({ results: completedResultsRef.current, status: "ready" });
      return;
    }

    setSearch({ results: [], status: "waiting" });
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void runSearch(normalized);
    }, SERMON_SEARCH_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, query, runSearch]);

  const submit = useCallback(() => {
    if (!enabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    void runSearch(query);
  }, [enabled, query, runSearch]);

  return {
    results: search.results,
    status: search.status,
    submit,
  };
}
