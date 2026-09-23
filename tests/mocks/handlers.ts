import type { RequestHandler } from "msw";

/**
 * Default MSW handlers, applied to every test via `test/setup.ts`.
 *
 * Conventions:
 *
 * - **Empty by default, and it stays that way.** `server.listen` runs with
 *   `onUnhandledRequest: "error"`, so any request a test does not explicitly
 *   mock fails that test. A network call should never be a silent no-op.
 * - **Only put a handler here if every test wants it** — a health check, or an
 *   endpoint the app hits on boot. Anything endpoint-specific belongs in the
 *   test that cares, via `server.use(...)`, which `setup.ts` resets after each
 *   test.
 * - **Handlers return fixtures built by `test/factories`,** never inline object
 *   literals, so a schema change breaks one builder instead of thirty tests.
 * - **Model failures too.** Timeouts and 500s deserve handlers as much as happy
 *   paths; reach for `HttpResponse.error()` and `http.get(..., () => new
 *   Promise(() => {}))` rather than mocking the client module.
 */
export const handlers: RequestHandler[] = [];
