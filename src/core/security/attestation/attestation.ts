import type {
  ApiErrorCode,
  ChallengeResponse,
  SessionCredentials,
  VerifyAttestationRequest,
} from "../../api/contracts/attestation";

/**
 * App attestation: proving to the backend that a request came from a genuine,
 * unmodified build of this app on real Apple hardware.
 *
 * The app has no accounts, so this is the *only* identity the backend gets. See
 * [docs/security/threat-model.md](../../../../docs/security/threat-model.md) for
 * what that does and does not buy, and
 * [docs/api/attestation.md](../../../../docs/api/attestation.md) for the server
 * side.
 *
 * **Nothing here throws across the boundary.** Every outcome — including a
 * device that cannot attest, a server that says no, and a network that dropped —
 * is a value the caller can branch on. Attestation failing is an expected state
 * on a Simulator, on an old device, and on a train, so making callers wrap every
 * call in try/catch would guarantee that some caller eventually does not.
 */

/** Where in the flow something happened. Useful in a log, not for branching. */
export type AttestationStage = "challenge" | "key-generation" | "attest" | "verify" | "assert";

/**
 * Why a device cannot attest.
 *
 * There is deliberately no separate `"simulator"` reason.
 * `DCAppAttestService.isSupported` is already `false` on the Simulator, so the
 * flow stops before any API that could tell us more, and neither
 * `expo-constants` nor React Native exposes a simulator flag. In practice
 * `app-attest-unavailable` *is* the Simulator: every device that meets the app's
 * minimum iOS supports App Attest. Distinguishing them would mean adding
 * `expo-device` to change a log label. See ADR 0005.
 */
type UnsupportedReason = "platform" | "app-attest-unavailable";

/** A device failure from the Secure Enclave, as opposed to a server one. */
type DeviceFailureCode = "DEVICE_ERROR";

export type FailureCode = ApiErrorCode | DeviceFailureCode;

export type DeviceSupport = { supported: true } | { supported: false; reason: UnsupportedReason };

export type AttestationResult =
  /** Attested just now. The credentials are the session's to take. */
  | { status: "attested"; keyId: string; credentials: SessionCredentials }
  /** Already attested on a previous launch; nothing to do. */
  | { status: "already-attested"; keyId: string }
  /** `EXPO_PUBLIC_ATTESTATION_ENABLED` is off. */
  | { status: "disabled" }
  | { status: "unsupported"; reason: UnsupportedReason }
  /** Worth trying again later. */
  | { status: "transient"; stage: AttestationStage; code: FailureCode }
  /** Final. Retrying in a loop would be an attack on our own backend. */
  | { status: "rejected"; stage: AttestationStage; code: FailureCode };

export type AssertionResult =
  | { status: "ok"; keyId: string; assertion: string; challenge: string }
  /** No key yet, or the server no longer knows this one. Attest, then retry. */
  | { status: "needs-attestation" }
  | { status: "disabled" }
  | { status: "unsupported"; reason: UnsupportedReason }
  | { status: "transient"; stage: AttestationStage; code: FailureCode }
  | { status: "rejected"; stage: AttestationStage; code: FailureCode };

export interface Attestation {
  /** Attests this install if it has not been attested already. */
  attest(): Promise<AttestationResult>;

  /**
   * An assertion over a freshly fetched challenge, for one sensitive request.
   *
   * Never cached: the whole point is that the challenge is single-use, so a
   * reused assertion is a replay.
   */
  createAssertion(): Promise<AssertionResult>;

  /** Forgets the stored `keyId`, so the next `attest()` starts from scratch. */
  reset(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

/**
 * The backend endpoints this module needs. Implementations throw `ApiError`;
 * this module catches and classifies.
 */
export interface AttestationApi {
  requestChallenge(keyId?: string): Promise<ChallengeResponse>;
  verifyAttestation(request: VerifyAttestationRequest): Promise<SessionCredentials>;
}

/**
 * The Secure Enclave, as a port.
 *
 * Thin on purpose: a real implementation is a handful of lines over
 * `@expo/app-integrity`, and everything interesting is testable against a fake.
 */
export interface AppAttestDevice {
  /**
   * Checked on every call rather than captured once.
   *
   * `@expo/app-integrity` exports `isSupported` as a module-scope **const**, so
   * reading it at our own module scope would freeze whatever it happened to be
   * at import time — which under Jest is `undefined`.
   */
  support(): DeviceSupport;
  generateKey(): Promise<string>;
  attestKey(keyId: string, challenge: string): Promise<string>;
  createAssertion(keyId: string, challenge: string): Promise<string>;
}
