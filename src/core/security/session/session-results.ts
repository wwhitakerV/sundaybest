import type { ApiError } from "../../api/api-error";
import type { AssertionResult, AttestationResult } from "../attestation/attestation";
import type { SessionResult } from "./session-types";

// What the session manager reports when attestation or a session request
// fails: each failure mapped, once, to a `SessionResult`.

/** An assertion the install could make. */
export type AssertionOk = Extract<AssertionResult, { status: "ok" }>;

/** An assertion the install could not make. */
export function assertionFailureToSession(
  result: Exclude<AssertionResult, { status: "ok" }>,
): SessionResult {
  switch (result.status) {
    case "needs-attestation":
      return { status: "needs-attestation" };
    case "disabled":
      return { status: "unavailable", reason: "disabled" };
    case "unsupported":
      return { status: "unavailable", reason: "unsupported" };
    case "transient":
      return { status: "transient", code: result.code };
    case "rejected":
      return { status: "rejected", code: result.code };
  }
}

/** An attestation that neither attested nor found the install already attested. */
export function attestFailureToSession(
  result: Exclude<AttestationResult, { status: "attested" | "already-attested" }>,
): SessionResult {
  switch (result.status) {
    case "disabled":
      return { status: "unavailable", reason: "disabled" };
    case "unsupported":
      return { status: "unavailable", reason: "unsupported" };
    case "transient":
      return { status: "transient", code: result.code };
    case "rejected":
      return { status: "rejected", code: result.code };
  }
}

/** A bootstrap or refresh request the server, or the network, turned down. */
export function requestFailureToSession(error: ApiError): SessionResult {
  return error.retryable
    ? { status: "transient", code: error.code }
    : { status: "rejected", code: error.code };
}
