import { HttpResponse, http, type RequestHandler } from "msw";

import type { ApiErrorCode, SessionCredentials } from "@/core/api/contracts/attestation";
import { defineFactory } from "@test/factories/build";

/**
 * A fake attestation backend, honouring
 * [docs/api/attestation.md](../../docs/api/attestation.md).
 *
 * Not registered by default. `test/setup.ts` starts MSW with
 * `onUnhandledRequest: "error"`, and that is the right default — a test that
 * talks to the network should have said so. Opt in per test:
 *
 * ```ts
 * server.use(...attestationHandlers());
 * server.use(attestationError("/attest/verify", "ATTESTATION_INVALID", 401));
 * ```
 *
 * The base URL matches `EXPO_PUBLIC_API_URL`'s development value, which
 * `test/setup.ts` sets.
 */
export const API_BASE_URL = "https://api.sundaybest.com";

/** 40 chars, so it satisfies `challengeResponseSchema`'s 32-char minimum. */
export const aChallenge = defineFactory(() => ({
  challenge: "0f8fb1c2".repeat(5),
  expiresAt: new Date(Date.now() + 120_000).toISOString(),
}));

export const someCredentials = defineFactory<SessionCredentials>(() => ({
  accessToken: "test-access-token",
  refreshToken: "test-refresh-token",
  expiresIn: 900,
}));

export type AttestationEndpoint = "/attest/challenge" | "/attest/verify" | "/session/refresh";

/**
 * The happy path for all three endpoints.
 *
 * Override a single response by passing it, rather than by re-declaring the
 * whole set:
 *
 * ```ts
 * server.use(...attestationHandlers({ credentials: someCredentials({ expiresIn: 60 }) }));
 * ```
 */
export function attestationHandlers(
  overrides: {
    challenge?: ReturnType<typeof aChallenge>;
    credentials?: SessionCredentials;
  } = {},
): RequestHandler[] {
  const challenge = overrides.challenge ?? aChallenge();
  const credentials = overrides.credentials ?? someCredentials();

  return [
    http.post(`${API_BASE_URL}/attest/challenge`, () => HttpResponse.json(challenge)),

    http.post(`${API_BASE_URL}/attest/verify`, () =>
      HttpResponse.json(credentials, { status: 201 }),
    ),

    http.post(`${API_BASE_URL}/session/refresh`, () => HttpResponse.json(credentials)),
  ];
}

/**
 * One endpoint failing with a documented error code.
 *
 * The status is passed explicitly rather than derived from the code, because the
 * pairing is part of the contract and a test that states it reads as a statement
 * about the contract rather than about this helper.
 */
export function attestationError(
  endpoint: AttestationEndpoint,
  code: ApiErrorCode,
  status: number,
  message?: string,
): RequestHandler {
  return http.post(`${API_BASE_URL}${endpoint}`, () =>
    HttpResponse.json({ error: message === undefined ? { code } : { code, message } }, { status }),
  );
}

/**
 * An endpoint that never responds, for testing timeout behaviour.
 *
 * `HttpResponse.error()` models a failed request; this models a hung one, which
 * is the more common and more awkward case on a mobile network.
 */
export function attestationHang(endpoint: AttestationEndpoint): RequestHandler {
  return http.post(`${API_BASE_URL}${endpoint}`, () => new Promise<never>(() => {}));
}

/** A transport-level failure: DNS, TLS, or a dropped connection. */
export function attestationNetworkFailure(endpoint: AttestationEndpoint): RequestHandler {
  return http.post(`${API_BASE_URL}${endpoint}`, () => HttpResponse.error());
}
