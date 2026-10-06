import type { ApiErrorCode } from "../contracts/errors.js";

const STATUS_BY_CODE: Readonly<Record<ApiErrorCode, number>> = {
  CHALLENGE_EXPIRED: 401,
  CHALLENGE_UNKNOWN: 401,
  ATTESTATION_INVALID: 401,
  ASSERTION_INVALID: 401,
  KEY_UNKNOWN: 404,
  KEY_REVOKED: 401,
  REFRESH_TOKEN_INVALID: 401,
  UNSUPPORTED_BUNDLE: 403,
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  SERMON_UNSUPPORTED: 400,
  SERMON_UNAVAILABLE: 422,
  TRANSCRIPT_UNAVAILABLE: 422,
  PLAN_NOT_READY: 409,
  DAY_LOCKED: 409,
  STUDY_INCOMPLETE: 409,
  QUICK_CHECK_REQUIRED: 409,
  ANSWER_ALREADY_SUBMITTED: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly exposeMessage: boolean;

  constructor(code: ApiErrorCode, message?: string, options?: { statusCode?: number; cause?: unknown; exposeMessage?: boolean }) {
    super(message ?? code, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? STATUS_BY_CODE[code];
    this.exposeMessage = options?.exposeMessage ?? this.statusCode < 500;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
