import {
  apiErrorEnvelopeSchema,
  challengeResponseSchema,
  sessionCredentialsSchema,
} from "@/core/api/contracts/attestation";
import {
  API_BASE_URL,
  attestationError,
  attestationHandlers,
  attestationNetworkFailure,
} from "@test/mocks/attestation-handlers";
import { server } from "@test/mocks/server";

/**
 * Keeps the three forms of the backend contract honest with each other.
 *
 * `docs/api/attestation.md` is the specification, the schemas in
 * `src/core/api/contracts/` are its executable form, and the MSW handlers are a
 * fake server. Nothing stops those drifting apart except a test that makes the
 * fake server's responses pass the app's own parsers — so if a handler is
 * changed to something the app would reject, this fails rather than a hundred
 * other tests passing against a fiction.
 */
describe("the fake attestation backend satisfies the app's own schemas", () => {
  beforeEach(() => {
    server.use(...attestationHandlers());
  });

  it("issues a challenge the client will accept", async () => {
    const response = await fetch(`${API_BASE_URL}/attest/challenge`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    expect(challengeResponseSchema.safeParse(await response.json()).success).toBe(true);
  });

  it("returns credentials the client will accept from /attest/verify", async () => {
    const response = await fetch(`${API_BASE_URL}/attest/verify`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    // 201 for a created registration, per the contract.
    expect(response.status).toBe(201);
    expect(sessionCredentialsSchema.safeParse(await response.json()).success).toBe(true);
  });

  it("returns credentials the client will accept from /session/refresh", async () => {
    const response = await fetch(`${API_BASE_URL}/session/refresh`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    expect(sessionCredentialsSchema.safeParse(await response.json()).success).toBe(true);
  });

  it("returns errors in the documented envelope", async () => {
    server.use(attestationError("/attest/verify", "ATTESTATION_INVALID", 401));

    const response = await fetch(`${API_BASE_URL}/attest/verify`, { method: "POST" });

    expect(response.status).toBe(401);
    const parsed = apiErrorEnvelopeSchema.safeParse(await response.json());
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.error.code).toBe("ATTESTATION_INVALID");
  });

  it("can model a transport failure, which produces no response at all", async () => {
    server.use(attestationNetworkFailure("/attest/challenge"));

    await expect(fetch(`${API_BASE_URL}/attest/challenge`, { method: "POST" })).rejects.toThrow();
  });
});
