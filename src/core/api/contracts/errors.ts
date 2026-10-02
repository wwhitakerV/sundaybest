import { z } from "zod";

/** Stable machine-readable failures for every /v1 endpoint. */
export const API_ERROR_CODES = [
  // Session / App Attest
  "CHALLENGE_EXPIRED",
  "CHALLENGE_UNKNOWN",
  "ATTESTATION_INVALID",
  "ASSERTION_INVALID",
  "KEY_UNKNOWN",
  "KEY_REVOKED",
  "REFRESH_TOKEN_INVALID",
  "UNSUPPORTED_BUNDLE",

  // Generic resource / request failures
  "VALIDATION_FAILED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "IDEMPOTENCY_CONFLICT",

  // SundayBest domain failures
  "SERMON_UNSUPPORTED",
  "SERMON_UNAVAILABLE",
  "TRANSCRIPT_UNAVAILABLE",
  "PLAN_NOT_READY",
  "DAY_LOCKED",
  "STUDY_INCOMPLETE",
  "QUICK_CHECK_REQUIRED",
  "ANSWER_ALREADY_SUBMITTED",

  // Operational
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

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
 * New server codes degrade to INTERNAL on older clients. That keeps an error
 * response from becoming a client crash while still defaulting to the safest
 * handling: do not pretend an unknown failure succeeded.
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
    message: z.string().max(1024).optional(),
    requestId: z.string().max(256).optional(),
  }),
});
