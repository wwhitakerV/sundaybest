import { useCallback, useEffect, useRef, useState } from "react";

import { useSundayBestApi } from "@/core/api/ApiProvider";
import {
  toSermonSearchResult,
  type SermonSearchResult,
} from "../data/search-sermons";
import {
  haveSameSermonSearchResults,
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
 * Search timing and presentation state for the real SundayBest sermon API.
 * Existing rows stay mounted while a new query is in flight so typing never
 * blanks the results area between requests.
 */
export function useSermonSearch(query: string, enabled: boolean) {
  const api = useSundayBestApi();
  const [search, setSearch] = useState<SermonSearchState>({
    results: [],
    status: "idle",
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const inFlightKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string | null>(null);
  const completedResultsRef = useRef<readonly SermonSearchResult[]>([]);

  const runSearch = useCallback(
    async (rawQuery: string) => {
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
        setSearch((current) => ({
          results: haveSameSermonSearchResults(
            current.results,
            completedResultsRef.current,
          )
            ? current.results
            : completedResultsRef.current,
          status: "ready",
        }));
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      inFlightKeyRef.current = key;
      setSearch((current) => ({ ...current, status: "searching" }));

      try {
        const response = await api.sermons.search(normalized);
        if (requestId !== requestIdRef.current) return;

        const results = response.sermons.map(toSermonSearchResult);
        inFlightKeyRef.current = null;
        completedKeyRef.current = key;
        completedResultsRef.current = results;
        setSearch((current) => ({
          results: haveSameSermonSearchResults(current.results, results)
            ? current.results
            : results,
          status: "ready",
        }));
      } catch {
        if (requestId !== requestIdRef.current) return;
        inFlightKeyRef.current = null;
        setSearch((current) => ({ ...current, status: "error" }));
      }
    },
    [api],
  );

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

    requestIdRef.current += 1;
    inFlightKeyRef.current = null;

    if (normalized.length < SERMON_SEARCH_MIN_CHARACTERS) {
      completedKeyRef.current = null;
      completedResultsRef.current = [];
      setSearch({ results: [], status: "idle" });
      return;
    }

    if (key === completedKeyRef.current) {
      setSearch((current) => ({
        results: haveSameSermonSearchResults(
          current.results,
          completedResultsRef.current,
        )
          ? current.results
          : completedResultsRef.current,
        status: "ready",
      }));
      return;
    }

    setSearch((current) => ({ ...current, status: "waiting" }));
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
