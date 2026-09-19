import { isRetryableErrorCode, type ApiErrorCode } from "./contracts/attestation";

/**
 * What shape of failure this was, independent of which documented error code the
 * server reported.
 *
 * Both questions matter and they are not the same one: a timeout and a response
 * that failed its own schema are both `INTERNAL` by code, and a caller must
 * treat them completely differently.
 */
export type ApiFailureKind =
  /** No response at all: DNS, TLS, a dropped connection, a pinning rejection. */
  | "network"
  /** Our own deadline fired. */
  | "timeout"
  /** 4xx. The request was understood and refused. */
  | "client"
  /** 5xx. The server broke. */
  | "server"
  /** A 2xx whose body did not match its contract. */
  | "schema"
  /** Refused before it left the device, because the device is not trustworthy. */
  | "integrity";

/**
 * Failures no amount of retrying improves.
 *
 * A server that sent a body failing its own contract will send the same body
 * again, and a request refused because the device is compromised does not become
 * acceptable on a second attempt.
 */
const NEVER_RETRYABLE: ReadonlySet<ApiFailureKind> = new Set(["schema", "integrity"]);

function inferKind(status: number | undefined): ApiFailureKind {
  if (status === undefined) return "network";
  if (status >= 500) return "server";
  if (status >= 400) return "client";

  // A 2xx or 3xx that reached here is a body problem, not a status problem.
  return "schema";
}

/**
 * A failed API call, classified by the contract's error code.
 *
 * Callers branch on `code` and `retryable`, never on the HTTP status alone and
 * never on the message — see the error table in
 * [docs/api/attestation.md](../../../docs/api/attestation.md).
 */
export class ApiError extends Error {
  readonly kind: ApiFailureKind;
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
    options: { kind?: ApiFailureKind; serverMessage?: string; cause?: unknown } = {},
  ) {
    super(`API request failed: ${code}`, { cause: options.cause });
    this.name = "ApiError";
    this.kind = options.kind ?? inferKind(status);
    this.code = code;
    this.status = status;
    // The kind can veto a code that would otherwise be retryable.
    this.retryable = isRetryableErrorCode(code) && !NEVER_RETRYABLE.has(this.kind);
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
