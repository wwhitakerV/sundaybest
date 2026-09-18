import { toApiError } from "../../api/api-error";
import {
  sessionCredentialsSchema,
  type RefreshRequest,
  type SessionCredentials,
} from "../../api/contracts/attestation";
import type { Attestation, FailureCode } from "../attestation/attestation";
import type { SecureStorage } from "../secure-storage/secure-storage";

const REFRESH_KEY = "session.refreshToken";

/**
 * Refresh this far before the token actually expires.
 *
 * A token with thirty seconds left will often be expired by the time a slow
 * request reaches the server. Refreshing inside the margin converts a class of
 * spurious 401s into a refresh nobody notices.
 */
const EXPIRY_SKEW_MS = 60_000;

type SessionResult =
  | { status: "ok"; accessToken: string }
  /** No usable refresh token or key. Run attestation, then try again. */
  | { status: "needs-attestation" }
  /** Attestation cannot run here at all, so there will never be a session. */
  | { status: "unavailable"; reason: "disabled" | "unsupported" }
  | { status: "transient"; code: FailureCode }
  | { status: "rejected"; code: FailureCode };

export interface SessionApi {
  refresh(request: RefreshRequest): Promise<SessionCredentials>;
}

export interface SessionManager {
  /** A usable access token, refreshing first if the current one is stale. */
  getAccessToken(): Promise<SessionResult>;

  /** Seeds the session from the credentials `attestation.attest()` returned. */
  adopt(credentials: SessionCredentials): Promise<void>;

  /**
   * Drops everything: the in-memory token, the stored refresh token, and any
   * refresh in flight. Called when tampering or an integrity failure is
   * detected — the app should not be holding anything that keeps it talking to
   * the backend.
   */
  clear(): Promise<void>;
}

export interface SessionDeps {
  api: SessionApi;
  attestation: Attestation;
  secureStorage: SecureStorage;
  /** Injected so expiry is testable without fake timers. */
  now?: () => number;
  skewMs?: number;
}

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

  async function refresh(): Promise<SessionResult> {
    const startedAt = generation;

    let stored: string | null;
    try {
      stored = await loadRefreshToken();
    } catch (cause) {
      return { status: "transient", code: toApiError(cause).code };
    }

    if (stored === null) return { status: "needs-attestation" };

    // A fresh assertion every time. This is what a stolen refresh token lacks.
    const assertion = await attestation.createAssertion();

    switch (assertion.status) {
      case "needs-attestation":
        return { status: "needs-attestation" };
      case "disabled":
        return { status: "unavailable", reason: "disabled" };
      case "unsupported":
        return { status: "unavailable", reason: "unsupported" };
      case "transient":
        return { status: "transient", code: assertion.code };
      case "rejected":
        return { status: "rejected", code: assertion.code };
      case "ok":
        break;
    }

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
        return { status: "needs-attestation" };
      }

      return error.retryable
        ? { status: "transient", code: error.code }
        : { status: "rejected", code: error.code };
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
