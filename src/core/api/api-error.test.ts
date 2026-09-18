import { ApiError, isApiError, toApiError } from "./api-error";

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
