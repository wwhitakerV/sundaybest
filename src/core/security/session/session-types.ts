import type {
  BootstrapSessionRequest,
  RefreshRequest,
  SessionCredentials,
} from "../../api/contracts/attestation";
import type { Attestation, FailureCode } from "../attestation/attestation";
import type { SecureStorage } from "../secure-storage/secure-storage";

export type SessionResult =
  | { status: "ok"; accessToken: string }
  /** Session bootstrap could not recover a usable attested install. */
  | { status: "needs-attestation" }
  /** Attestation cannot run here at all, so there will never be a session. */
  | { status: "unavailable"; reason: "disabled" | "unsupported" }
  | { status: "transient"; code: FailureCode }
  | { status: "rejected"; code: FailureCode };

export interface SessionApi {
  refresh(request: RefreshRequest): Promise<SessionCredentials>;
  bootstrap(request: BootstrapSessionRequest): Promise<SessionCredentials>;
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
