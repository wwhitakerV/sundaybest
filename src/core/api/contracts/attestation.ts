import { z } from "zod";

/**
 * The executable form of [docs/api/attestation.md](../../../../docs/api/attestation.md).
 *
 * No server implements this yet; `test/mocks/attestation-handlers.ts` is a fake
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
// Errors
// ---------------------------------------------------------------------------

export const API_ERROR_CODES = [
  "CHALLENGE_EXPIRED",
  "CHALLENGE_UNKNOWN",
  "ATTESTATION_INVALID",
  "ASSERTION_INVALID",
  "KEY_UNKNOWN",
  "KEY_REVOKED",
  "REFRESH_TOKEN_INVALID",
  "RATE_LIMITED",
  "UNSUPPORTED_BUNDLE",
  "INTERNAL",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * Codes worth retrying. Everything else is final.
 *
 * The distinction is load-bearing, not cosmetic: a client that retries
 * `ATTESTATION_INVALID` in a loop has turned its own failure into a
 * denial-of-service attack on its backend, and one that gives up on
 * `RATE_LIMITED` is broken for the rest of the hour.
 */
export const RETRYABLE_ERROR_CODES: ReadonlySet<ApiErrorCode> = new Set([
  "CHALLENGE_EXPIRED",
  "CHALLENGE_UNKNOWN",
  "RATE_LIMITED",
  "INTERNAL",
]);

export function isRetryableErrorCode(code: ApiErrorCode): boolean {
  return RETRYABLE_ERROR_CODES.has(code);
}

/**
 * An unknown code degrades to `INTERNAL` instead of failing the parse.
 *
 * A server that adds an error code must not make the client crash on the very
 * response that was reporting a problem, and `INTERNAL` is the conservative
 * reading of "something we do not recognise went wrong": back off and retry,
 * rather than assuming it is fatal or assuming it is fine.
 */
const apiErrorCodeSchema = z
  .string()
  .transform((value): ApiErrorCode => {
    const known = API_ERROR_CODES.find((code) => code === value);
    return known ?? "INTERNAL";
  })
  .pipe(z.enum(API_ERROR_CODES));

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    /** For logs only. The client branches on `code`. May be absent. */
    message: z.string().max(1024).optional(),
  }),
});
