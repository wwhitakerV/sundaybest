import { toApiError } from "../../api/api-error";
import { sessionCredentialsSchema, type SessionCredentials } from "../../api/contracts/attestation";
import {
  assertionFailureToSession,
  attestFailureToSession,
  requestFailureToSession,
  type AssertionOk,
} from "./session-results";
import type { SessionDeps, SessionManager, SessionResult } from "./session-types";

const REFRESH_KEY = "session.refreshToken";

/**
 * Refresh this far before the token actually expires.
 *
 * A token with thirty seconds left will often be expired by the time a slow
 * request reaches the server. Refreshing inside the margin converts a class of
 * spurious 401s into a refresh nobody notices.
 */
const EXPIRY_SKEW_MS = 60_000;

interface ActiveToken {
  accessToken: string;
  expiresAtMs: number;
}

/**
 * Short-lived access tokens, memory first.
 *
 * Two properties are the point of this module:
 *
 * 1. **The access token never touches storage.** It lives in a closure and dies
 *    with the process. Only the refresh token is persisted, and a refresh token
 *    on its own is not enough — refreshing also requires a fresh assertion from
 *    the Secure Enclave, so one lifted from a backup is inert.
 * 2. **One refresh at a time.** Refresh tokens rotate, so two concurrent
 *    refreshes would each invalidate the other's token; a screen firing five
 *    requests on mount would leave four of them failed and the stored token
 *    whichever raced last. Concurrent callers await the in-flight refresh.
 */
export function createSessionManager({
  api,
  attestation,
  secureStorage,
  now = Date.now,
  skewMs = EXPIRY_SKEW_MS,
}: SessionDeps): SessionManager {
  let active: ActiveToken | null = null;
  let refreshToken: string | null = null;
  let inFlight: Promise<SessionResult> | null = null;

  /**
   * Incremented by `clear()`. A refresh that was already running when the
   * session was cleared compares this against the value it started with, and
   * discards its result rather than repopulating a session that was deliberately
   * wiped — the tamper response has to actually stick.
   */
  let generation = 0;

  function isUsable(token: ActiveToken | null): token is ActiveToken {
    return token !== null && token.expiresAtMs - skewMs > now();
  }

  async function storeCredentials(credentials: SessionCredentials): Promise<void> {
    active = {
      accessToken: credentials.accessToken,
      expiresAtMs: now() + credentials.expiresIn * 1000,
    };
    refreshToken = credentials.refreshToken;
    await secureStorage.set(REFRESH_KEY, credentials.refreshToken);
  }

  async function loadRefreshToken(): Promise<string | null> {
    refreshToken ??= await secureStorage.get(REFRESH_KEY);
    return refreshToken;
  }

  async function discardRefreshToken(): Promise<void> {
    refreshToken = null;
    try {
      await secureStorage.remove(REFRESH_KEY);
    } catch {
      // The caller is already being told to re-attest; a failed cleanup must not
      // turn that into a thrown error.
    }
  }

  /**
   * Gets fresh credentials without a refresh token. A valid existing App Attest
   * key proves the install through an assertion; a brand-new install performs
   * full attestation and adopts the credentials returned by /attest/verify.
   */
  async function bootstrap(expectedGeneration = generation): Promise<SessionResult> {
    const assertion = await attestation.createAssertion();

    if (assertion.status === "needs-attestation") {
      const result = await attestation.attest();
      switch (result.status) {
        case "attested":
          if (generation !== expectedGeneration) return { status: "needs-attestation" };
          await storeCredentials(result.credentials);
          return { status: "ok", accessToken: result.credentials.accessToken };
        case "already-attested":
          // A key appeared between the assertion and attest calls (another
          // bootstrap won the race). Try the assertion path once more.
          break;
        default:
          return attestFailureToSession(result);
      }

      const retryAssertion = await attestation.createAssertion();
      if (retryAssertion.status !== "ok") return assertionFailureToSession(retryAssertion);
      return exchangeAssertion(retryAssertion, expectedGeneration);
    }

    if (assertion.status !== "ok") return assertionFailureToSession(assertion);

    return exchangeAssertion(assertion, expectedGeneration);
  }

  /** Trades an install's assertion for credentials, unless the session was cleared meanwhile. */
  async function exchangeAssertion(
    { keyId, assertion, challenge }: AssertionOk,
    expectedGeneration: number,
  ): Promise<SessionResult> {
    try {
      const credentials = sessionCredentialsSchema.parse(
        await api.bootstrap({ keyId, assertion, challenge }),
      );
      if (generation !== expectedGeneration) return { status: "needs-attestation" };
      await storeCredentials(credentials);
      return { status: "ok", accessToken: credentials.accessToken };
    } catch (cause) {
      return requestFailureToSession(toApiError(cause));
    }
  }

  async function refresh(): Promise<SessionResult> {
    const startedAt = generation;

    let stored: string | null;
    try {
      stored = await loadRefreshToken();
    } catch (cause) {
      return { status: "transient", code: toApiError(cause).code };
    }

    if (stored === null) return bootstrap(startedAt);

    // A fresh assertion every time. This is what a stolen refresh token lacks.
    const assertion = await attestation.createAssertion();

    if (assertion.status === "needs-attestation") {
      await discardRefreshToken();
      return bootstrap(startedAt);
    }
    if (assertion.status !== "ok") return assertionFailureToSession(assertion);

    let credentials: SessionCredentials;
    try {
      const response = await api.refresh({
        keyId: assertion.keyId,
        refreshToken: stored,
        assertion: assertion.assertion,
        challenge: assertion.challenge,
      });

      // Parsed, not trusted. A response outside the contract is treated as a
      // server fault rather than adopted — a bogus `expiresIn` would either
      // refresh on every request or keep a token alive far past what the threat
      // model assumes.
      credentials = sessionCredentialsSchema.parse(response);
    } catch (cause) {
      const error = toApiError(cause);

      // A refresh token is single-use, so an invalid one is either already spent
      // or leaked. Keeping it would loop forever.
      if (error.code === "REFRESH_TOKEN_INVALID") {
        await discardRefreshToken();
        return bootstrap(startedAt);
      }

      return requestFailureToSession(error);
    }

    // The session was cleared while this was in flight. Honour that.
    if (generation !== startedAt) return { status: "needs-attestation" };

    await storeCredentials(credentials);

    return { status: "ok", accessToken: credentials.accessToken };
  }

  return {
    async getAccessToken(): Promise<SessionResult> {
      if (isUsable(active)) return { status: "ok", accessToken: active.accessToken };

      // Cleared on settle, so a failed refresh does not become a cached failure.
      inFlight ??= refresh().finally(() => {
        inFlight = null;
      });

      return inFlight;
    },

    async adopt(credentials: SessionCredentials): Promise<void> {
      await storeCredentials(credentials);
    },

    async clear(): Promise<void> {
      generation += 1;
      active = null;
      inFlight = null;
      await discardRefreshToken();
    },
  };
}
