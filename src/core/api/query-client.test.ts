import { ApiError } from "./api-error";
import { createQueryClient, sensitiveQueryOptions, shouldRetry } from "./query-client";

describe("shouldRetry", () => {
  /**
   * The rule that matters most. A 4xx means the request was understood and
   * refused; repeating it adds load to an endpoint that has already said no, and
   * on a rate-limited endpoint it makes the situation worse.
   */
  it("does not retry a 4xx", () => {
    expect(shouldRetry(0, new ApiError("KEY_REVOKED", 403))).toBe(false);
    expect(shouldRetry(0, new ApiError("ATTESTATION_INVALID", 401))).toBe(false);
  });

  it("retries a 5xx once", () => {
    expect(shouldRetry(0, new ApiError("INTERNAL", 500))).toBe(true);
    expect(shouldRetry(1, new ApiError("INTERNAL", 500))).toBe(false);
  });

  it("retries a transport failure", () => {
    expect(shouldRetry(0, new ApiError("INTERNAL", undefined))).toBe(true);
  });

  it("retries a rate limit, which is the one 429 worth waiting out", () => {
    expect(shouldRetry(0, new ApiError("RATE_LIMITED", 429))).toBe(true);
  });

  it("does not retry a schema mismatch, because the next response is the same", () => {
    expect(shouldRetry(0, new ApiError("INTERNAL", 200, { kind: "schema" }))).toBe(false);
  });

  it("does not retry a request refused on integrity grounds", () => {
    expect(shouldRetry(0, new ApiError("INTERNAL", undefined, { kind: "integrity" }))).toBe(false);
  });

  /**
   * Anything that is not an ApiError came from our own code — a bug in a
   * `queryFn`, a thrown TypeError — and repeating it just runs the bug again.
   */
  it.each([new TypeError("oops"), new Error("boom"), undefined, "a string"])(
    "does not retry %p, which is not an api failure",
    (error) => {
      expect(shouldRetry(0, error)).toBe(false);
    },
  );
});

describe("createQueryClient", () => {
  it("applies the retry policy to queries", () => {
    const defaults = createQueryClient().getDefaultOptions();

    expect(defaults.queries?.retry).toBe(shouldRetry);
  });

  /**
   * A mutation is not idempotent unless its endpoint says so, and TanStack
   * cannot know which ones are. The API client decides per request, so the
   * default here has to be "never".
   */
  it("never retries a mutation", () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });

  it("does not refetch on focus, which on a phone means every task switch", () => {
    expect(createQueryClient().getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it("does refetch on reconnect, which is a real signal", () => {
    expect(createQueryClient().getDefaultOptions().queries?.refetchOnReconnect).toBe(true);
  });

  it("keeps cached data for a bounded time", () => {
    const queries = createQueryClient().getDefaultOptions().queries;

    expect(queries?.gcTime).toBeGreaterThan(0);
    expect(queries?.gcTime).toBeLessThanOrEqual(15 * 60 * 1000);
  });
});

describe("sensitiveQueryOptions", () => {
  it("drops the cache entry as soon as nothing is watching it", () => {
    expect(sensitiveQueryOptions.gcTime).toBe(0);
  });
});

/**
 * The guarantee behind "never persist sensitive queries": there is no persister,
 * because there is no persistence package installed at all.
 *
 * Asserting the absence of a dependency looks odd until you consider the
 * alternative — a comment saying "do not add a persister", which nothing
 * enforces. Adding one breaks this test, which is exactly the conversation that
 * should happen: writing API responses to disk needs an ADR, not an npm install.
 */
describe("query persistence", () => {
  it("has no persistence package installed", () => {
    const manifest = jest.requireActual<{
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    }>("../../../package.json");

    const installed = [
      ...Object.keys(manifest.dependencies),
      ...Object.keys(manifest.devDependencies),
    ];

    expect(installed.filter((name) => name.includes("persist"))).toEqual([]);
  });
});
