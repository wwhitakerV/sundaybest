import { http, HttpResponse, type RequestHandler } from "msw";

import { API_URL, aUser, someCredentials, someSettings } from "../factories/api";

/**
 * Default MSW handlers, applied to every test via `test/setup.ts`.
 *
 * Conventions:
 *
 * - **Only what the app requests on every launch lives here**: the
 *   development session, the reader, their settings, and their plans — a
 *   first-launch reader with none. `server.listen` runs with
 *   `onUnhandledRequest: "error"`, so any other request a test does not
 *   explicitly mock fails that test. A network call is never a silent no-op.
 * - **Anything endpoint-specific belongs in the test that cares**, via
 *   `server.use(...)`, which `setup.ts` resets after each test. That includes
 *   a returning reader or one with plans: override these.
 * - **Handlers return fixtures built by `test/factories`,** never inline object
 *   literals, so a schema change breaks one builder instead of thirty tests.
 * - **Model failures too.** Timeouts and 500s deserve handlers as much as happy
 *   paths; reach for `HttpResponse.error()` and `http.get(..., () => new
 *   Promise(() => {}))` rather than mocking the client module.
 */
export const handlers: RequestHandler[] = [
  http.post(`${API_URL}/v1/dev/session`, () => HttpResponse.json(someCredentials())),
  http.get(`${API_URL}/v1/me`, () => HttpResponse.json({ user: aUser() })),
  http.get(`${API_URL}/v1/me/settings`, () => HttpResponse.json({ settings: someSettings() })),
  http.get(`${API_URL}/v1/plans`, () => HttpResponse.json({ plans: [] })),
];
