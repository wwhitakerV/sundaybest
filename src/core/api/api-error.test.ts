import { ApiError, isApiError, toApiError } from "./api-error";

describe("ApiError kinds", () => {
  /**
   * `kind` answers "what shape of failure was this" and `code` answers "which
   * documented error did the server report". They are different questions: a
   * timeout and a malformed response are both `INTERNAL` by code and must be
   * handled completely differently.
   */
  it("infers the kind from the status when it is not given", () => {
    expect(new ApiError("INTERNAL", undefined).kind).toBe("network");
    expect(new ApiError("KEY_UNKNOWN", 404).kind).toBe("client");
    expect(new ApiError("INTERNAL", 503).kind).toBe("server");
  });

  it("takes an explicit kind for failures no status describes", () => {
    expect(new ApiError("INTERNAL", undefined, { kind: "timeout" }).kind).toBe("timeout");
    expect(new ApiError("INTERNAL", 200, { kind: "schema" }).kind).toBe("schema");
  });

  /**
   * Retrying these is pointless or wrong. A server that sent a response failing
   * its own contract will send the same shape again, and a request refused
   * because the device is compromised does not become acceptable on the second
   * attempt — it just costs the user another round trip.
   */
  it.each(["schema", "integrity"] as const)("never retries a %s failure", (kind) => {
    // INTERNAL is retryable by code, so this proves kind overrides it.
    expect(new ApiError("INTERNAL", undefined, { kind }).retryable).toBe(false);
  });

  it("still retries a timeout, which is the case retrying exists for", () => {
    expect(new ApiError("INTERNAL", undefined, { kind: "timeout" }).retryable).toBe(true);
  });
});

describe("ApiError", () => {
  it("carries the code and whether it is worth retrying", () => {
    const error = new ApiError("RATE_LIMITED", 429);

    expect(error.code).toBe("RATE_LIMITED");
    expect(error.status).toBe(429);
    expect(error.retryable).toBe(true);
  });

  it("marks a final code as not retryable", () => {
    expect(new ApiError("ATTESTATION_INVALID", 401).retryable).toBe(false);
  });

  /**
   * The server's `message` field is for logs and may be attacker-influenced in
   * principle, so it is kept off the error message the app constructs. Anything
   * that reaches a log line should be the code.
   */
  it("does not put the server's message in its own message", () => {
    const error = new ApiError("INTERNAL", 500, { serverMessage: "leaked detail" });

    expect(error.message).not.toContain("leaked detail");
    expect(error.message).toContain("INTERNAL");
    expect(error.serverMessage).toBe("leaked detail");
  });
});

describe("isApiError", () => {
  it("recognises one", () => {
    expect(isApiError(new ApiError("INTERNAL", 500))).toBe(true);
  });

  it("does not claim anything else is one", () => {
    expect(isApiError(new Error("nope"))).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError({ code: "INTERNAL" })).toBe(false);
  });
});

describe("toApiError", () => {
  it("passes an ApiError through unchanged", () => {
    const original = new ApiError("KEY_REVOKED", 403);

    expect(toApiError(original)).toBe(original);
  });

  /**
   * A transport failure — no response at all — is retryable. This is the case
   * that matters on a phone: a tunnel dropped, the radio was off, the request
   * timed out. Treating it as final would make the app give up on a flaky
   * network instead of trying again.
   */
  it("turns an unknown failure into a retryable INTERNAL", () => {
    const error = toApiError(new TypeError("Network request failed"));

    expect(error.code).toBe("INTERNAL");
    expect(error.retryable).toBe(true);
    expect(error.cause).toBeInstanceOf(TypeError);
  });
});
