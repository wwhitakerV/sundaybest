import { z } from "zod";

import { createFakeAttestation, FAKE_ASSERTION, FAKE_KEY_ID } from "@test/mocks/attestation";
import { createIntegrityState } from "@/core/security/integrity/policy";

import { createApiClient, type ApiClientDeps } from "./client";

const BASE_URL = "https://api.sundaybest.com";

const bodySchema = z.object({ id: z.string() });

/** A session that always has a token, which is the uninteresting case. */
function workingSession() {
  return {
    getAccessToken: jest.fn().mockResolvedValue({ status: "ok", accessToken: "token-1" }),
    adopt: jest.fn(),
    clear: jest.fn(),
  };
}

function setup(overrides: Partial<ApiClientDeps> = {}) {
  const fetchImpl = jest.fn<Promise<Response>, [string, RequestInit]>();
  const sleep = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);
  const session = workingSession();
  const { attestation, calls: attestationCalls } = createFakeAttestation();
  const integrity = createIntegrityState();

  const deps: ApiClientDeps = {
    baseUrl: BASE_URL,
    session,
    attestation,
    integrity,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    sleep,
    ...overrides,
  };

  return { client: createApiClient(deps), fetchImpl, sleep, session, attestationCalls, integrity };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * A mock that builds a **fresh** Response per call.
 *
 * A Response body can only be read once, so handing the same instance to two
 * calls fails with "Body has already been read" — which real `fetch` never
 * does, since every call produces a new Response. Any test that expects more
 * than one request must use this.
 */
function alwaysJson(body: unknown, status = 200) {
  return () => Promise.resolve(jsonResponse(body, status));
}

describe("request", () => {
  it("resolves the path against the base url and parses the body", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }));

    await expect(client.request({ path: "/things", schema: bodySchema })).resolves.toEqual({
      id: "abc",
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${BASE_URL}/things`);
  });

  it("sends the session token", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }));

    await client.request({ path: "/things", schema: bodySchema });

    const headers = new Headers(fetchImpl.mock.calls[0]?.[1].headers);
    expect(headers.get("authorization")).toBe("Bearer token-1");
  });

  it("sends a json body and content type on a write", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }, 201));

    await client.request({
      path: "/things",
      method: "POST",
      body: { name: "x" },
      schema: bodySchema,
    });

    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "x" }));
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("does not send a body on a GET", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }));

    await client.request({ path: "/things", schema: bodySchema });

    expect(fetchImpl.mock.calls[0]?.[1].body).toBeUndefined();
  });

  it("passes an abort signal, so a request cannot hang forever", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }));

    await client.request({ path: "/things", schema: bodySchema });

    expect(fetchImpl.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe("failures", () => {
  it("reports a transport failure as a network failure", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockRejectedValue(new TypeError("Network request failed"));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("reports our own deadline as a timeout, not as a network failure", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockImplementation((_url, init) => {
      // What fetch does when the signal it was handed aborts.
      const error = new Error("Aborted");
      error.name = "AbortError";
      void init;
      return Promise.reject(error);
    });

    await expect(
      client.request({ path: "/things", schema: bodySchema, timeoutMs: 10 }),
    ).rejects.toMatchObject({ kind: "timeout", retryable: true });
  });

  it("reports a 4xx as a client failure, with the documented code", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ error: { code: "KEY_REVOKED" } }, 403));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "client",
      code: "KEY_REVOKED",
      retryable: false,
    });
  });

  it("reports a 5xx as a server failure", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ error: { code: "INTERNAL" } }, 500));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "server",
    });
  });

  /**
   * An error body that is not the documented envelope still has to produce a
   * usable error. A server returning an HTML error page must not crash the
   * client on top of whatever already went wrong.
   */
  it("survives an error response that is not the documented envelope", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(new Response("<html>gateway timeout</html>", { status: 504 }));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "server",
      code: "INTERNAL",
    });
  });

  /**
   * A 200 whose body does not match its contract is a failure, not a warning.
   * Passing a partially-understood payload into the app is the
   * `as`-on-untrusted-data pattern the security rules forbid.
   */
  it("rejects a 2xx whose body does not match the schema", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ identifier: "abc" }));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "schema",
      retryable: false,
    });
  });

  it("rejects a 2xx that is not json at all", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(new Response("not json", { status: 200 }));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "schema",
    });
  });

  it("never puts the response body in the error message", async () => {
    const { client, fetchImpl } = setup();
    const planted = "FAKE-CREDENTIAL-SHAPED-STRING";
    fetchImpl.mockResolvedValue(jsonResponse({ leaked: planted }));

    let message = "";
    try {
      await client.request({ path: "/things", schema: bodySchema });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).not.toContain(planted);
  });
});

describe("the session", () => {
  it("asks for attestation when the session has none, without calling fetch", async () => {
    const session = workingSession();
    session.getAccessToken.mockResolvedValue({ status: "needs-attestation" });
    const { client, fetchImpl } = setup({ session });

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      code: "REFRESH_TOKEN_INVALID",
      retryable: false,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("passes a transient session failure through as retryable", async () => {
    const session = workingSession();
    session.getAccessToken.mockResolvedValue({ status: "transient", code: "RATE_LIMITED" });
    const { client } = setup({ session });

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      code: "RATE_LIMITED",
      retryable: true,
    });
  });
});

describe("sensitive requests", () => {
  it("attaches a fresh assertion", async () => {
    const { client, fetchImpl, attestationCalls } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }));

    await client.request({ path: "/things", schema: bodySchema, sensitive: true });

    const headers = new Headers(fetchImpl.mock.calls[0]?.[1].headers);
    expect(headers.get("x-attestation-keyid")).toBe(FAKE_KEY_ID);
    expect(headers.get("x-attestation-assertion")).toBe(FAKE_ASSERTION);
    expect(headers.get("x-attestation-challenge")).toBeTruthy();
    expect(attestationCalls.createAssertion).toBe(1);
  });

  it("does not attach an assertion to an ordinary request", async () => {
    const { client, fetchImpl, attestationCalls } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }));

    await client.request({ path: "/things", schema: bodySchema });

    expect(new Headers(fetchImpl.mock.calls[0]?.[1].headers).has("x-attestation-keyid")).toBe(
      false,
    );
    expect(attestationCalls.createAssertion).toBe(0);
  });

  /**
   * A fresh assertion per request is the whole mechanism — the challenge is
   * single-use, so a reused assertion is a replay.
   */
  it("fetches a new assertion for every sensitive request", async () => {
    const { client, fetchImpl, attestationCalls } = setup();
    fetchImpl.mockImplementation(alwaysJson({ id: "abc" }));

    await client.request({ path: "/a", schema: bodySchema, sensitive: true });
    await client.request({ path: "/b", schema: bodySchema, sensitive: true });

    expect(attestationCalls.createAssertion).toBe(2);
  });

  it("fails closed when an assertion cannot be produced", async () => {
    const { attestation } = createFakeAttestation({
      assertion: { status: "transient", stage: "challenge", code: "RATE_LIMITED" },
    });
    const { client, fetchImpl } = setup({ attestation });

    await expect(
      client.request({ path: "/things", schema: bodySchema, sensitive: true }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  /**
   * The link between the integrity policy and the network layer. Client-side
   * enforcement is bypassable on a device the attacker owns, which is why the
   * server verifies assertions independently — this is defence in depth, not the
   * defence.
   */
  it("refuses a sensitive request when integrity disabled sensitive features", async () => {
    const { client, fetchImpl, integrity } = setup();
    integrity.report("privilegedAccess");

    await expect(
      client.request({ path: "/things", schema: bodySchema, sensitive: true }),
    ).rejects.toMatchObject({ kind: "integrity", retryable: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("still allows ordinary requests on a device that failed an integrity check", async () => {
    const { client, fetchImpl, integrity } = setup();
    integrity.report("privilegedAccess");
    fetchImpl.mockResolvedValue(jsonResponse({ id: "abc" }));

    await expect(client.request({ path: "/things", schema: bodySchema })).resolves.toEqual({
      id: "abc",
    });
  });
});

describe("retrying", () => {
  it("retries a GET once on a server failure, then succeeds", async () => {
    const { client, fetchImpl, sleep } = setup();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse({ error: { code: "INTERNAL" } }, 500))
      .mockResolvedValueOnce(jsonResponse({ id: "abc" }));

    await expect(client.request({ path: "/things", schema: bodySchema })).resolves.toEqual({
      id: "abc",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("gives up after one retry rather than looping", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockImplementation(alwaysJson({ error: { code: "INTERNAL" } }, 500));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "server",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("waits before retrying", async () => {
    const { client, fetchImpl, sleep } = setup();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse({ error: { code: "INTERNAL" } }, 500))
      .mockResolvedValueOnce(jsonResponse({ id: "abc" }));

    await client.request({ path: "/things", schema: bodySchema });

    expect(sleep.mock.calls[0]?.[0]).toBeGreaterThan(0);
  });

  it("does not retry a 4xx, because a refused request stays refused", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ error: { code: "KEY_REVOKED" } }, 403));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "client",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not retry a schema mismatch", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ wrong: true }));

    await expect(client.request({ path: "/things", schema: bodySchema })).rejects.toMatchObject({
      kind: "schema",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  /**
   * The rule that matters. A timeout does not tell the client whether the server
   * processed the request, so retrying a POST is how one request becomes two of
   * whatever it created.
   */
  it("does not retry a POST by default", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl.mockResolvedValue(jsonResponse({ error: { code: "INTERNAL" } }, 500));

    await expect(
      client.request({ path: "/things", method: "POST", schema: bodySchema }),
    ).rejects.toMatchObject({ kind: "server" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries a POST that declares itself idempotent", async () => {
    const { client, fetchImpl } = setup();
    fetchImpl
      .mockResolvedValueOnce(jsonResponse({ error: { code: "INTERNAL" } }, 500))
      .mockResolvedValueOnce(jsonResponse({ id: "abc" }));

    await expect(
      client.request({ path: "/things", method: "POST", schema: bodySchema, idempotent: true }),
    ).resolves.toEqual({ id: "abc" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry a request refused on integrity grounds", async () => {
    const { client, fetchImpl, integrity } = setup();
    integrity.report("hooks");

    await expect(
      client.request({ path: "/things", schema: bodySchema, sensitive: true }),
    ).rejects.toMatchObject({ kind: "integrity" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
