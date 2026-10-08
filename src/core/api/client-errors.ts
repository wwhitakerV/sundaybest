import type { z } from "zod";

import type { Attestation } from "../security/attestation/attestation";
import type { SessionManager } from "../security/session/session-types";
import { ApiError } from "./api-error";
import { apiErrorEnvelopeSchema, type ApiErrorCode } from "./contracts/errors";

// How the client turns what went wrong — an error response, a body outside its
// schema, no session, no assertion — into one typed `ApiError`.

/**
 * Reads an error response.
 *
 * The documented envelope is tried first; anything else — an HTML error page
 * from a proxy, an empty body — degrades to `INTERNAL` rather than throwing on
 * top of whatever already failed.
 */
export async function responseToApiError(response: Response): Promise<ApiError> {
  let code: ApiErrorCode = "INTERNAL";
  let serverMessage: string | undefined;

  try {
    const parsed = apiErrorEnvelopeSchema.safeParse(await response.json());
    if (parsed.success) {
      code = parsed.data.error.code;
      serverMessage = parsed.data.error.message;
    }
  } catch {
    // Not JSON. The status is still meaningful.
  }

  return new ApiError(code, response.status, {
    ...(serverMessage === undefined ? {} : { serverMessage }),
  });
}

/**
 * Parses a success body.
 *
 * A 2xx whose body fails its own contract is a failure: passing a
 * partially-understood payload into the app is exactly the `as`-on-untrusted-data
 * pattern the security rules forbid. The body never reaches the error message,
 * because a body that surprised us is the last thing to put in a log.
 */
export async function parseBody<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (cause) {
    throw new ApiError("INTERNAL", response.status, { kind: "schema", cause });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError("INTERNAL", response.status, { kind: "schema" });
  }

  return parsed.data;
}

type SessionFailure = Exclude<
  Awaited<ReturnType<SessionManager["getAccessToken"]>>,
  { status: "ok" }
>;

export function sessionFailureToApiError(failure: SessionFailure): ApiError {
  switch (failure.status) {
    case "needs-attestation":
      return new ApiError("REFRESH_TOKEN_INVALID", 401);
    case "unavailable":
      // Attestation cannot run here at all, so there will never be a token.
      // Not retryable — a retry would be a loop with no exit.
      return new ApiError("ATTESTATION_INVALID", 401);
    case "transient":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, undefined);
    case "rejected":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, 403);
  }
}

type AssertionFailure = Exclude<
  Awaited<ReturnType<Attestation["createAssertion"]>>,
  { status: "ok" }
>;

export function assertionFailureToApiError(failure: AssertionFailure): ApiError {
  switch (failure.status) {
    case "needs-attestation":
      return new ApiError("KEY_UNKNOWN", 404);
    case "disabled":
    case "unsupported":
      // The request needs an assertion this device will never produce. Fail
      // closed rather than sending it unsigned and letting the server decide.
      return new ApiError("ATTESTATION_INVALID", undefined, { kind: "integrity" });
    case "transient":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, undefined);
    case "rejected":
      return new ApiError(failure.code === "DEVICE_ERROR" ? "INTERNAL" : failure.code, 403);
  }
}
