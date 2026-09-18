import { isRetryableErrorCode, type ApiErrorCode } from "./contracts/attestation";

/**
 * A failed API call, classified by the contract's error code.
 *
 * Callers branch on `code` and `retryable`, never on the HTTP status alone and
 * never on the message — see the error table in
 * [docs/api/attestation.md](../../../docs/api/attestation.md).
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** `undefined` for a transport failure, where no response arrived. */
  readonly status: number | undefined;
  readonly retryable: boolean;
  /**
   * The server's own `message`, kept separate from `this.message`.
   *
   * It is diagnostic text from outside the app, so it stays out of the message
   * the app builds and logs. Read it in a debugger, not in a log line.
   */
  readonly serverMessage: string | undefined;

  constructor(
    code: ApiErrorCode,
    status?: number,
    options: { serverMessage?: string; cause?: unknown } = {},
  ) {
    super(`API request failed: ${code}`, { cause: options.cause });
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.retryable = isRetryableErrorCode(code);
    this.serverMessage = options.serverMessage;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/**
 * Normalises anything thrown by a request into an `ApiError`.
 *
 * Anything unrecognised becomes a **retryable** `INTERNAL`, because the common
 * unrecognised case on a phone is a transport failure — dropped tunnel, radio
 * off, timeout — and those deserve another attempt. A caller that must not retry
 * checks `retryable` rather than assuming.
 */
export function toApiError(cause: unknown): ApiError {
  if (isApiError(cause)) return cause;

  return new ApiError("INTERNAL", undefined, { cause });
}
