import { z } from "zod";

/**
 * The executable form of [docs/api/attestation.md](../../../../docs/api/attestation.md).
 *
 * No server implements this yet; `tests/mocks/attestation-handlers.ts` is a fake
 * one that honours it. The document, these schemas, and those handlers are one
 * contract in three forms — change one and change all three.
 *
 * Responses are **parsed, not cast**. Every field here crosses the trust
 * boundary from a server the app does not control onto a device it does, which
 * is exactly where `as` is a bug.
 */

/** Long enough to carry the 16 bytes of entropy the contract requires. */
const challengeSchema = z.string().min(32).max(512);

const keyIdSchema = z.string().min(1).max(512);

/** Base64/base64url blobs from the Secure Enclave. Opaque to the client. */
const attestationBlobSchema = z.string().min(16).max(16_384);

// ---------------------------------------------------------------------------
// POST /attest/challenge
// ---------------------------------------------------------------------------

/** `keyId` is absent on first launch, when no key exists yet. */
export const challengeRequestSchema = z.object({
  keyId: keyIdSchema.optional(),
});

export const challengeResponseSchema = z.object({
  challenge: challengeSchema,
  /** Advisory for the client; the server enforces the TTL regardless. */
  expiresAt: z.iso.datetime(),
});

export type ChallengeResponse = z.infer<typeof challengeResponseSchema>;

// ---------------------------------------------------------------------------
// POST /attest/verify
// ---------------------------------------------------------------------------

export const verifyAttestationRequestSchema = z.object({
  keyId: keyIdSchema,
  attestation: attestationBlobSchema,
  challenge: challengeSchema,
});

export type VerifyAttestationRequest = z.infer<typeof verifyAttestationRequestSchema>;

// ---------------------------------------------------------------------------
// Session credentials — the response of both /attest/verify and /session/refresh
// ---------------------------------------------------------------------------

export const sessionCredentialsSchema = z.object({
  /** Kept in memory only. Never written to storage. */
  accessToken: z.string().min(1),
  /** Rotated on every refresh, so this is always a new value. */
  refreshToken: z.string().min(1),
  /**
   * Bounded, not clamped. Below 60s the client would refresh on almost every
   * request; above an hour the token outlives what the threat model assumes. A
   * value outside the range is a contract violation and should fail loudly.
   */
  expiresIn: z.number().int().min(60).max(3600),
});

export type SessionCredentials = z.infer<typeof sessionCredentialsSchema>;

// ---------------------------------------------------------------------------
// POST /session/refresh
// ---------------------------------------------------------------------------

export const refreshRequestSchema = z.object({
  keyId: keyIdSchema,
  refreshToken: z.string().min(1),
  /** A fresh assertion every time — this is what a stolen refresh token lacks. */
  assertion: attestationBlobSchema,
  challenge: challengeSchema,
});

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

// ---------------------------------------------------------------------------
// POST /session/bootstrap
// ---------------------------------------------------------------------------

/**
 * Restores a session when this install still has a valid App Attest key but no
 * refresh token (first API use after keychain cleanup, rotation failure, etc.).
 */
export const bootstrapSessionRequestSchema = z.object({
  keyId: keyIdSchema,
  assertion: attestationBlobSchema,
  challenge: challengeSchema,
});

export type BootstrapSessionRequest = z.infer<typeof bootstrapSessionRequestSchema>;

// Error codes are shared by the whole API, not only attestation. Re-export
// them here for compatibility with the security modules that historically
// imported from this contract.
export {
  API_ERROR_CODES,
  RETRYABLE_ERROR_CODES,
  apiErrorEnvelopeSchema,
  isRetryableErrorCode,
  type ApiErrorCode,
} from "./errors.js";
