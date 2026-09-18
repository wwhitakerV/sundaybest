import {
  API_ERROR_CODES,
  RETRYABLE_ERROR_CODES,
  apiErrorEnvelopeSchema,
  challengeRequestSchema,
  challengeResponseSchema,
  refreshRequestSchema,
  sessionCredentialsSchema,
  verifyAttestationRequestSchema,
} from "./attestation";

const CHALLENGE = "0f8f".repeat(8);
const KEY_ID = "aGVsbG8gd29ybGQ";

describe("challengeRequestSchema", () => {
  it("accepts a request with no key, which is first launch", () => {
    expect(challengeRequestSchema.parse({})).toEqual({});
  });

  it("accepts a request carrying the install's key", () => {
    expect(challengeRequestSchema.parse({ keyId: KEY_ID })).toEqual({ keyId: KEY_ID });
  });

  it("rejects an empty key rather than sending it", () => {
    expect(challengeRequestSchema.safeParse({ keyId: "" }).success).toBe(false);
  });
});

describe("challengeResponseSchema", () => {
  const valid = { challenge: CHALLENGE, expiresAt: "2026-09-17T12:00:00.000Z" };

  it("parses the documented response", () => {
    expect(challengeResponseSchema.parse(valid)).toEqual(valid);
  });

  it("rejects a challenge too short to carry 16 bytes of entropy", () => {
    expect(challengeResponseSchema.safeParse({ ...valid, challenge: "abc" }).success).toBe(false);
  });

  it("rejects a non-ISO expiry", () => {
    expect(challengeResponseSchema.safeParse({ ...valid, expiresAt: "soon" }).success).toBe(false);
  });

  /**
   * Extra fields are dropped rather than rejected, so the server can add a field
   * without every client failing closed on it. Nothing unknown reaches the app.
   */
  it("drops fields it does not know about", () => {
    expect(challengeResponseSchema.parse({ ...valid, futureField: 1 })).toEqual(valid);
  });
});

describe("verifyAttestationRequestSchema", () => {
  it("requires the key, the attestation, and the challenge it was made over", () => {
    const valid = { keyId: KEY_ID, attestation: "o2NmbXR".repeat(4), challenge: CHALLENGE };

    expect(verifyAttestationRequestSchema.parse(valid)).toEqual(valid);
    expect(verifyAttestationRequestSchema.safeParse({ keyId: KEY_ID }).success).toBe(false);
  });
});

describe("sessionCredentialsSchema", () => {
  const valid = { accessToken: "eyJ.a.b", refreshToken: "rt_123", expiresIn: 900 };

  it("parses the documented response", () => {
    expect(sessionCredentialsSchema.parse(valid)).toEqual(valid);
  });

  /**
   * A lifetime the client cannot honour is a contract violation, not a value to
   * clamp: a zero or negative `expiresIn` would make the client refresh on every
   * single request, and an absurdly long one would keep a token alive far past
   * what the threat model assumes.
   */
  it.each([0, -1, 59, 3601])("rejects an expiresIn of %p", (expiresIn) => {
    expect(sessionCredentialsSchema.safeParse({ ...valid, expiresIn }).success).toBe(false);
  });

  it("rejects a fractional expiresIn", () => {
    expect(sessionCredentialsSchema.safeParse({ ...valid, expiresIn: 900.5 }).success).toBe(false);
  });
});

describe("refreshRequestSchema", () => {
  it("requires a fresh assertion alongside the refresh token", () => {
    const valid = {
      keyId: KEY_ID,
      refreshToken: "rt_123",
      assertion: "omlzaWduYXR1cmVYRjBEAiB",
      challenge: CHALLENGE,
    };

    expect(refreshRequestSchema.parse(valid)).toEqual(valid);

    const { assertion: _dropped, ...withoutAssertion } = valid;
    expect(refreshRequestSchema.safeParse(withoutAssertion).success).toBe(false);
  });
});

describe("apiErrorEnvelopeSchema", () => {
  it("parses a documented error code", () => {
    expect(
      apiErrorEnvelopeSchema.parse({
        error: { code: "CHALLENGE_EXPIRED", message: "Challenge has expired." },
      }),
    ).toEqual({ error: { code: "CHALLENGE_EXPIRED", message: "Challenge has expired." } });
  });

  it("treats a message as optional, because it is only ever for logs", () => {
    expect(apiErrorEnvelopeSchema.parse({ error: { code: "INTERNAL" } })).toEqual({
      error: { code: "INTERNAL" },
    });
  });

  /**
   * An unrecognised code becomes INTERNAL rather than a parse failure. A server
   * that adds an error code should not make the client crash on the very
   * response that was telling it something went wrong — and INTERNAL is the
   * conservative reading: retry with backoff, do not assume it is fatal.
   */
  it("maps an unknown code to INTERNAL", () => {
    expect(apiErrorEnvelopeSchema.parse({ error: { code: "WHAT_IS_THIS" } }).error.code).toBe(
      "INTERNAL",
    );
  });

  it("rejects a body that is not the documented envelope", () => {
    expect(apiErrorEnvelopeSchema.safeParse({ message: "nope" }).success).toBe(false);
  });
});

describe("error code tables", () => {
  it("marks exactly the codes the contract calls retryable", () => {
    expect([...RETRYABLE_ERROR_CODES].sort()).toEqual([
      "CHALLENGE_EXPIRED",
      "CHALLENGE_UNKNOWN",
      "INTERNAL",
      "RATE_LIMITED",
    ]);
  });

  it("keeps every retryable code inside the known set", () => {
    for (const code of RETRYABLE_ERROR_CODES) {
      expect(API_ERROR_CODES).toContain(code);
    }
  });
});
