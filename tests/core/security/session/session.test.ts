import { ApiError } from "@/core/api/api-error";
import type { SessionCredentials } from "@/core/api/contracts/attestation";
import {
  FAKE_ASSERTION,
  FAKE_CHALLENGE,
  FAKE_KEY_ID,
  createFakeAttestation,
} from "@tests/mocks/attestation";
import { createInMemorySecureStorage } from "@tests/mocks/secure-storage";

import { createSessionManager, type SessionApi } from "@/core/security/session/session";
import type { AssertionResult } from "@/core/security/attestation/attestation";

const REFRESH_KEY = "session.refreshToken";

const CREDENTIALS: SessionCredentials = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  expiresIn: 900,
};

const ROTATED: SessionCredentials = {
  accessToken: "access-2",
  refreshToken: "refresh-2",
  expiresIn: 900,
};

function setup(
  options: {
    api?: Partial<SessionApi>;
    assertion?: AssertionResult;
    storedRefreshToken?: string;
    now?: () => number;
  } = {},
) {
  const secureStorage = createInMemorySecureStorage(
    options.storedRefreshToken === undefined
      ? {}
      : { [REFRESH_KEY]: JSON.stringify(options.storedRefreshToken) },
  );

  const refresh = jest.fn<Promise<SessionCredentials>, [unknown]>().mockResolvedValue(ROTATED);
  const api: SessionApi = { refresh, ...options.api };

  const { attestation, calls } = createFakeAttestation({ assertion: options.assertion });

  const session = createSessionManager({
    api,
    attestation,
    secureStorage,
    now: options.now ?? (() => 1_000_000),
  });

  return { session, secureStorage, refresh, attestationCalls: calls };
}

describe("adopt", () => {
  it("takes the credentials attestation produced and serves the token", async () => {
    const { session, refresh } = setup();

    await session.adopt(CREDENTIALS);

    await expect(session.getAccessToken()).resolves.toEqual({
      status: "ok",
      accessToken: "access-1",
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  /**
   * The access token is the thing worth stealing off a device, and it is
   * short-lived enough that persisting it buys almost nothing. Only the refresh
   * token is written down, and refreshing needs a fresh assertion, so a refresh
   * token lifted from a backup is not usable on its own.
   */
  it("persists the refresh token and only the refresh token", async () => {
    const { session, secureStorage } = setup();

    await session.adopt(CREDENTIALS);

    expect([...secureStorage.items.keys()]).toEqual([REFRESH_KEY]);
    await expect(secureStorage.get(REFRESH_KEY)).resolves.toBe("refresh-1");
  });
});

describe("getAccessToken", () => {
  it("refreshes when there is no token in memory, using the stored refresh token", async () => {
    const { session, refresh } = setup({ storedRefreshToken: "refresh-1" });

    await expect(session.getAccessToken()).resolves.toEqual({
      status: "ok",
      accessToken: "access-2",
    });
    expect(refresh).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: FAKE_KEY_ID, refreshToken: "refresh-1" }),
    );
  });

  it("sends a fresh assertion with every refresh", async () => {
    const { session, refresh, attestationCalls } = setup({ storedRefreshToken: "refresh-1" });

    await session.getAccessToken();

    expect(attestationCalls.createAssertion).toBe(1);
    expect(refresh.mock.calls[0]?.[0]).toMatchObject({
      assertion: FAKE_ASSERTION,
      challenge: FAKE_CHALLENGE,
    });
  });

  it("stores the rotated refresh token, so the old one is not reused", async () => {
    const { session, secureStorage } = setup({ storedRefreshToken: "refresh-1" });

    await session.getAccessToken();

    await expect(secureStorage.get(REFRESH_KEY)).resolves.toBe("refresh-2");
  });

  it("serves a cached token without refreshing again", async () => {
    const { session, refresh } = setup({ storedRefreshToken: "refresh-1" });

    await session.getAccessToken();
    await session.getAccessToken();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  /**
   * A token that expires in 30 seconds will be expired by the time a slow
   * request reaches the server. Refreshing inside a skew margin turns a class of
   * spurious 401s into a refresh the user never sees.
   */
  it("refreshes a token that is still valid but inside the skew margin", async () => {
    let now = 1_000_000;
    const { session, refresh } = setup({ storedRefreshToken: "refresh-1", now: () => now });

    await session.getAccessToken();
    expect(refresh).toHaveBeenCalledTimes(1);

    // 900s lifetime, 60s skew: at 860s the token is still valid but inside it.
    now += 860_000;
    await session.getAccessToken();

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("keeps serving a token that is comfortably inside its lifetime", async () => {
    let now = 1_000_000;
    const { session, refresh } = setup({ storedRefreshToken: "refresh-1", now: () => now });

    await session.getAccessToken();
    now += 100_000;
    await session.getAccessToken();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  /**
   * The requirement that makes this class worth having. Without it, a screen
   * that fires five requests on mount would start five refreshes, each one
   * rotating the refresh token and invalidating the other four — so four
   * requests fail and the stored token is whichever raced last.
   */
  describe("one refresh at a time", () => {
    it("shares a single refresh between concurrent callers", async () => {
      let release: (value: SessionCredentials) => void = () => {};
      const pending = new Promise<SessionCredentials>((resolve) => {
        release = resolve;
      });
      const refresh = jest.fn<Promise<SessionCredentials>, [unknown]>(() => pending);
      const { session } = setup({ storedRefreshToken: "refresh-1", api: { refresh } });

      const inFlight = [
        session.getAccessToken(),
        session.getAccessToken(),
        session.getAccessToken(),
      ];
      release(ROTATED);
      const results = await Promise.all(inFlight);

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(results).toEqual([
        { status: "ok", accessToken: "access-2" },
        { status: "ok", accessToken: "access-2" },
        { status: "ok", accessToken: "access-2" },
      ]);
    });

    it("asks for only one assertion for a shared refresh", async () => {
      const { session, attestationCalls } = setup({ storedRefreshToken: "refresh-1" });

      await Promise.all([session.getAccessToken(), session.getAccessToken()]);

      expect(attestationCalls.createAssertion).toBe(1);
    });

    it("allows a new refresh after one fails, rather than caching the failure", async () => {
      const refresh = jest
        .fn<Promise<SessionCredentials>, [unknown]>()
        .mockRejectedValueOnce(new ApiError("INTERNAL", 500))
        .mockResolvedValue(ROTATED);
      const { session } = setup({ storedRefreshToken: "refresh-1", api: { refresh } });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "transient",
        code: "INTERNAL",
      });
      await expect(session.getAccessToken()).resolves.toEqual({
        status: "ok",
        accessToken: "access-2",
      });
    });
  });

  describe("when there is nothing to refresh with", () => {
    it("asks for attestation when no refresh token is stored", async () => {
      const { session, refresh } = setup();

      await expect(session.getAccessToken()).resolves.toEqual({ status: "needs-attestation" });
      expect(refresh).not.toHaveBeenCalled();
    });

    it("asks for attestation when the assertion says the key is gone", async () => {
      const { session } = setup({
        storedRefreshToken: "refresh-1",
        assertion: { status: "needs-attestation" },
      });

      await expect(session.getAccessToken()).resolves.toEqual({ status: "needs-attestation" });
    });
  });

  it("reports a keychain read failure as transient", async () => {
    const { attestation } = createFakeAttestation();
    const session = createSessionManager({
      api: { refresh: jest.fn() },
      attestation,
      secureStorage: {
        get: () => Promise.reject(new Error("keychain unavailable")),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
      },
    });

    await expect(session.getAccessToken()).resolves.toEqual({
      status: "transient",
      code: "INTERNAL",
    });
  });

  describe("when attestation cannot help", () => {
    it("reports the session unavailable when attestation is disabled", async () => {
      const { session } = setup({
        storedRefreshToken: "refresh-1",
        assertion: { status: "disabled" },
      });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "unavailable",
        reason: "disabled",
      });
    });

    it("reports the session unavailable on a device that cannot attest", async () => {
      const { session } = setup({
        storedRefreshToken: "refresh-1",
        assertion: { status: "unsupported", reason: "app-attest-unavailable" },
      });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "unavailable",
        reason: "unsupported",
      });
    });

    it("passes a transient assertion failure through", async () => {
      const { session } = setup({
        storedRefreshToken: "refresh-1",
        assertion: { status: "transient", stage: "challenge", code: "RATE_LIMITED" },
      });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "transient",
        code: "RATE_LIMITED",
      });
    });

    it("passes a rejected assertion through as final", async () => {
      const { session } = setup({
        storedRefreshToken: "refresh-1",
        assertion: { status: "rejected", stage: "challenge", code: "KEY_REVOKED" },
      });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "rejected",
        code: "KEY_REVOKED",
      });
    });
  });

  describe("when the server rejects the refresh", () => {
    /**
     * A refresh token is single-use, so an invalid one means it was already
     * spent or it leaked. Either way it is dead: keeping it would loop, so it is
     * discarded and the caller re-attests.
     */
    it("discards the refresh token and asks for attestation", async () => {
      const refresh = jest
        .fn<Promise<SessionCredentials>, [unknown]>()
        .mockRejectedValue(new ApiError("REFRESH_TOKEN_INVALID", 401));
      const { session, secureStorage } = setup({
        storedRefreshToken: "refresh-1",
        api: { refresh },
      });

      await expect(session.getAccessToken()).resolves.toEqual({ status: "needs-attestation" });
      await expect(secureStorage.get(REFRESH_KEY)).resolves.toBeNull();
    });

    it("reports a retryable failure as transient and keeps the token", async () => {
      const refresh = jest
        .fn<Promise<SessionCredentials>, [unknown]>()
        .mockRejectedValue(new ApiError("RATE_LIMITED", 429));
      const { session, secureStorage } = setup({
        storedRefreshToken: "refresh-1",
        api: { refresh },
      });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "transient",
        code: "RATE_LIMITED",
      });
      await expect(secureStorage.get(REFRESH_KEY)).resolves.toBe("refresh-1");
    });

    it("reports a final failure as rejected", async () => {
      const refresh = jest
        .fn<Promise<SessionCredentials>, [unknown]>()
        .mockRejectedValue(new ApiError("KEY_REVOKED", 403));
      const { session } = setup({ storedRefreshToken: "refresh-1", api: { refresh } });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "rejected",
        code: "KEY_REVOKED",
      });
    });

    it("reports an out-of-contract response as transient rather than trusting it", async () => {
      const refresh = jest
        .fn<Promise<SessionCredentials>, [unknown]>()
        // expiresIn is outside the contract's 60..3600 range.
        .mockResolvedValue({ ...ROTATED, expiresIn: 99_999 });
      const { session } = setup({ storedRefreshToken: "refresh-1", api: { refresh } });

      await expect(session.getAccessToken()).resolves.toEqual({
        status: "transient",
        code: "INTERNAL",
      });
    });
  });
});

/**
 * `clear` is the tamper response: if integrity checks fail, the app should not be
 * holding anything that lets it keep talking to the backend.
 */
describe("clear", () => {
  it("wipes the token in memory and the one in the keychain", async () => {
    const { session, secureStorage, refresh } = setup();
    await session.adopt(CREDENTIALS);

    await session.clear();

    expect(secureStorage.items.size).toBe(0);
    await expect(session.getAccessToken()).resolves.toEqual({ status: "needs-attestation" });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("abandons an in-flight refresh instead of letting it repopulate the session", async () => {
    let release: (value: SessionCredentials) => void = () => {};
    let markCalled: () => void = () => {};
    // Waiting on this rather than on a tick count: the refresh has several
    // awaits before it reaches the API, and guessing how many is how a test
    // like this becomes flaky.
    const reachedTheApi = new Promise<void>((resolve) => {
      markCalled = resolve;
    });
    const refresh = jest.fn<Promise<SessionCredentials>, [unknown]>(() => {
      markCalled();
      return new Promise<SessionCredentials>((resolve) => {
        release = resolve;
      });
    });
    const { session, secureStorage } = setup({
      storedRefreshToken: "refresh-1",
      api: { refresh },
    });

    const pending = session.getAccessToken();
    await reachedTheApi;
    await session.clear();
    release(ROTATED);

    await expect(pending).resolves.toEqual({ status: "needs-attestation" });
    expect(secureStorage.items.size).toBe(0);
    await expect(session.getAccessToken()).resolves.toEqual({ status: "needs-attestation" });
  });
});
