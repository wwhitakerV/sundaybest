import { QueryClient, type DefaultOptions } from "@tanstack/react-query";

import { ApiError } from "./api-error";

/**
 * TanStack Query, configured for a security posture rather than for
 * convenience.
 *
 * **Nothing is persisted.** No persister is installed and no persistence
 * package is a dependency, so cached query data lives in memory and dies with
 * the process. `query-client.test.ts` asserts that no persistence package is
 * installed, which means adding one later breaks a test — persistence of API
 * responses to disk is a decision that needs an ADR, not a convenient default.
 */

/** One retry, matching the API client's own policy. */
const MAX_RETRIES = 1;

/**
 * Whether a failed query is worth repeating.
 *
 * Exported because it is the interesting part of the config: a rejected request
 * repeated is still rejected, and retrying a 4xx turns the client into a source
 * of load against an endpoint that has already said no.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;

  // Anything that is not an ApiError came from our own code, not the network.
  // Repeating it will produce the same bug.
  if (!(error instanceof ApiError)) return false;

  return error.retryable;
}

const defaultOptions: DefaultOptions = {
  queries: {
    retry: shouldRetry,

    // Five minutes of freshness, ten of retention. Long enough to make
    // navigation feel instant, short enough that data does not sit in memory
    // long after the screen that needed it is gone.
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,

    // There is no window to focus on a phone, and the equivalent — coming back
    // from the app switcher — would refetch every query on every task switch.
    refetchOnWindowFocus: false,

    // A reconnect is a genuine signal that a previously failed query might now
    // succeed, so this one stays on.
    refetchOnReconnect: true,
  },
  mutations: {
    // Never. A mutation is not idempotent unless its endpoint says so, and
    // TanStack cannot know which those are — the API client decides per request.
    retry: false,
  },
};

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}

/**
 * Options for a query whose data must not outlive its use.
 *
 * `gcTime: 0` drops the cache entry as soon as the last observer unmounts, so
 * sensitive data does not sit in memory behind a screen the user has left.
 * Spread into the query's own options:
 *
 * ```ts
 * useQuery({ queryKey: ["thing"], queryFn, ...sensitiveQueryOptions });
 * ```
 */
export const sensitiveQueryOptions = {
  gcTime: 0,
  staleTime: 0,
} as const;
