import { ApiError } from "@/core/api/api-error";
import {
  FAKE_ASSERTION,
  FAKE_ATTESTATION,
  FAKE_CHALLENGE,
  FAKE_CREDENTIALS,
  FAKE_KEY_ID,
  createFakeAppAttestDevice,
  createFakeAttestationApi,
} from "@tests/mocks/attestation";
import { createInMemorySecureStorage } from "@tests/mocks/secure-storage";

import { createAppAttestation } from "@/core/security/attestation/app-attest";
import type { AppAttestDevice, AttestationApi } from "@/core/security/attestation/attestation";

const STORED_KEY = "attestation.keyId";

function setup(
  options: {
    api?: Partial<AttestationApi>;
    device?: Partial<AppAttestDevice>;
    enabled?: boolean;
    storedKeyId?: string;
  } = {},
) {
  const secureStorage = createInMemorySecureStorage(
    options.storedKeyId === undefined ? {} : { [STORED_KEY]: JSON.stringify(options.storedKeyId) },
  );
  const { api, requests } = createFakeAttestationApi(options.api);
  const { device, calls } = createFakeAppAttestDevice(options.device);

  const attestation = createAppAttestation({
    api,
    device,
    secureStorage,
    enabled: options.enabled ?? true,
  });

  return { attestation, secureStorage, requests, calls };
}

describe("attest", () => {
  it("runs the full flow and stores the key id", async () => {
    const { attestation, secureStorage, requests, calls } = setup();

    const result = await attestation.attest();

    expect(result).toEqual({
      status: "attested",
      keyId: FAKE_KEY_ID,
      credentials: FAKE_CREDENTIALS,
    });
    expect(calls.generateKey).toBe(1);
    expect(requests.verified).toEqual([
      { keyId: FAKE_KEY_ID, attestation: FAKE_ATTESTATION, challenge: FAKE_CHALLENGE },
    ]);
    await expect(secureStorage.get(STORED_KEY)).resolves.toBe(FAKE_KEY_ID);
  });

  it("asks for a challenge without a key id, because there is no key yet", async () => {
    const { attestation, requests } = setup();

    await attestation.attest();

    expect(requests.challengeKeyIds).toEqual([undefined]);
  });

  /**
   * Apple limits how many App Attest keys an install may create, so re-running
   * attestation when a key already exists is not merely wasteful — it burns a
   * finite resource.
   */
  it("does nothing when the install is already attested", async () => {
    const { attestation, calls, requests } = setup({ storedKeyId: "existing-key" });

    await expect(attestation.attest()).resolves.toEqual({
      status: "already-attested",
      keyId: "existing-key",
    });
    expect(calls.generateKey).toBe(0);
    expect(requests.challengeKeyIds).toEqual([]);
  });

  it("reports disabled without touching the device or the network", async () => {
    const { attestation, calls, requests } = setup({ enabled: false });

    await expect(attestation.attest()).resolves.toEqual({ status: "disabled" });
    expect(calls.generateKey).toBe(0);
    expect(requests.challengeKeyIds).toEqual([]);
  });

  describe("unsupported devices", () => {
    it.each(["platform", "app-attest-unavailable"] as const)("reports %s", async (reason) => {
      const { attestation, requests } = setup({
        device: { support: () => ({ supported: false, reason }) },
      });

      await expect(attestation.attest()).resolves.toEqual({ status: "unsupported", reason });
      expect(requests.challengeKeyIds).toEqual([]);
    });
  });

  describe("failures", () => {
    it("classifies a retryable challenge failure as transient", async () => {
      const { attestation } = setup({
        api: { requestChallenge: () => Promise.reject(new ApiError("RATE_LIMITED", 429)) },
      });

      await expect(attestation.attest()).resolves.toEqual({
        status: "transient",
        stage: "challenge",
        code: "RATE_LIMITED",
      });
    });

    it("classifies a rejected attestation as final, not transient", async () => {
      const { attestation } = setup({
        api: {
          verifyAttestation: () => Promise.reject(new ApiError("ATTESTATION_INVALID", 401)),
        },
      });

      await expect(attestation.attest()).resolves.toEqual({
        status: "rejected",
        stage: "verify",
        code: "ATTESTATION_INVALID",
      });
    });

    it("treats a transport failure as transient", async () => {
      const { attestation } = setup({
        api: { requestChallenge: () => Promise.reject(new TypeError("Network request failed")) },
      });

      await expect(attestation.attest()).resolves.toEqual({
        status: "transient",
        stage: "challenge",
        code: "INTERNAL",
      });
    });

    it("treats a Secure Enclave failure during key generation as transient", async () => {
      const { attestation } = setup({
        device: { generateKey: () => Promise.reject(new Error("DCError 2")) },
      });

      await expect(attestation.attest()).resolves.toEqual({
        status: "transient",
        stage: "key-generation",
        code: "DEVICE_ERROR",
      });
    });

    it("treats a Secure Enclave failure during attestation as transient", async () => {
      const { attestation } = setup({
        device: { attestKey: () => Promise.reject(new Error("DCError 3")) },
      });

      await expect(attestation.attest()).resolves.toEqual({
        status: "transient",
        stage: "attest",
        code: "DEVICE_ERROR",
      });
    });

    /**
     * The key is stored only after the server accepts it. Storing it first would
     * leave an install holding a key the backend has never heard of, and every
     * later call would fail with KEY_UNKNOWN until something cleared it.
     */
    it("does not store the key id when the server rejects it", async () => {
      const { attestation, secureStorage } = setup({
        api: {
          verifyAttestation: () => Promise.reject(new ApiError("ATTESTATION_INVALID", 401)),
        },
      });

      await attestation.attest();

      await expect(secureStorage.get(STORED_KEY)).resolves.toBeNull();
    });

    it("reports a keychain read failure as transient", async () => {
      const { api } = createFakeAttestationApi();
      const { device } = createFakeAppAttestDevice();
      const attestation = createAppAttestation({
        api,
        device,
        enabled: true,
        secureStorage: {
          get: () => Promise.reject(new Error("keychain unavailable")),
          set: () => Promise.resolve(),
          remove: () => Promise.resolve(),
        },
      });

      // Cannot tell whether a key already exists, so attesting might mint a
      // second one. Stopping is the safe answer.
      await expect(attestation.attest()).resolves.toEqual({
        status: "transient",
        stage: "challenge",
        code: "DEVICE_ERROR",
      });
    });

    it("reports a keychain write failure as transient", async () => {
      const { api } = createFakeAttestationApi();
      const { device } = createFakeAppAttestDevice();
      const attestation = createAppAttestation({
        api,
        device,
        enabled: true,
        secureStorage: {
          get: () => Promise.resolve(null),
          set: () => Promise.reject(new Error("keychain unavailable")),
          remove: () => Promise.resolve(),
        },
      });

      await expect(attestation.attest()).resolves.toEqual({
        status: "transient",
        stage: "verify",
        code: "DEVICE_ERROR",
      });
    });
  });
});

describe("createAssertion", () => {
  it("fetches a fresh challenge and signs it", async () => {
    const { attestation, requests, calls } = setup({ storedKeyId: FAKE_KEY_ID });

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "ok",
      keyId: FAKE_KEY_ID,
      assertion: FAKE_ASSERTION,
      challenge: FAKE_CHALLENGE,
    });
    expect(requests.challengeKeyIds).toEqual([FAKE_KEY_ID]);
    expect(calls.createAssertion).toBe(1);
  });

  /**
   * A cached assertion is a replay. Two calls must produce two challenges, even
   * though this fake returns the same string for both.
   */
  it("never reuses a challenge across calls", async () => {
    const { attestation, requests } = setup({ storedKeyId: FAKE_KEY_ID });

    await attestation.createAssertion();
    await attestation.createAssertion();

    expect(requests.challengeKeyIds).toEqual([FAKE_KEY_ID, FAKE_KEY_ID]);
  });

  it("asks for attestation when there is no stored key", async () => {
    const { attestation, requests } = setup();

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "needs-attestation",
    });
    expect(requests.challengeKeyIds).toEqual([]);
  });

  it("reports disabled", async () => {
    const { attestation } = setup({ enabled: false, storedKeyId: FAKE_KEY_ID });

    await expect(attestation.createAssertion()).resolves.toEqual({ status: "disabled" });
  });

  it("reports an unsupported device", async () => {
    const { attestation } = setup({
      storedKeyId: FAKE_KEY_ID,
      device: { support: () => ({ supported: false, reason: "app-attest-unavailable" }) },
    });

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "unsupported",
      reason: "app-attest-unavailable",
    });
  });

  /**
   * KEY_UNKNOWN means the server has no record of this key — a wiped backend, or
   * a key that was never registered. The stored key is useless, so it is thrown
   * away and the caller is told to attest. Leaving it in place would loop
   * forever on a key that can never work.
   */
  it("discards the stored key and asks for attestation on KEY_UNKNOWN", async () => {
    const { attestation, secureStorage } = setup({
      storedKeyId: FAKE_KEY_ID,
      api: { requestChallenge: () => Promise.reject(new ApiError("KEY_UNKNOWN", 404)) },
    });

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "needs-attestation",
    });
    await expect(secureStorage.get(STORED_KEY)).resolves.toBeNull();
  });

  /**
   * KEY_REVOKED is the opposite call. The server knows this install and has
   * decided against it, so re-attesting would just create another key for the
   * same device and burn Apple's per-install budget doing it.
   */
  it("keeps the stored key and refuses to retry on KEY_REVOKED", async () => {
    const { attestation, secureStorage } = setup({
      storedKeyId: FAKE_KEY_ID,
      api: { requestChallenge: () => Promise.reject(new ApiError("KEY_REVOKED", 403)) },
    });

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "rejected",
      stage: "challenge",
      code: "KEY_REVOKED",
    });
    await expect(secureStorage.get(STORED_KEY)).resolves.toBe(FAKE_KEY_ID);
  });

  it("classifies a retryable challenge failure as transient", async () => {
    const { attestation } = setup({
      storedKeyId: FAKE_KEY_ID,
      api: { requestChallenge: () => Promise.reject(new ApiError("INTERNAL", 500)) },
    });

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "transient",
      stage: "challenge",
      code: "INTERNAL",
    });
  });

  it("treats a Secure Enclave signing failure as transient", async () => {
    const { attestation } = setup({
      storedKeyId: FAKE_KEY_ID,
      device: { createAssertion: () => Promise.reject(new Error("DCError 3")) },
    });

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "transient",
      stage: "assert",
      code: "DEVICE_ERROR",
    });
  });

  it("reports a keychain read failure as transient", async () => {
    const { api } = createFakeAttestationApi();
    const { device } = createFakeAppAttestDevice();
    const attestation = createAppAttestation({
      api,
      device,
      enabled: true,
      secureStorage: {
        get: () => Promise.reject(new Error("keychain unavailable")),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
      },
    });

    await expect(attestation.createAssertion()).resolves.toEqual({
      status: "transient",
      stage: "challenge",
      code: "DEVICE_ERROR",
    });
  });
});

describe("reset", () => {
  it("forgets the stored key so the next attest starts over", async () => {
    const { attestation, secureStorage, calls } = setup({ storedKeyId: FAKE_KEY_ID });

    await attestation.reset();

    await expect(secureStorage.get(STORED_KEY)).resolves.toBeNull();

    await expect(attestation.attest()).resolves.toMatchObject({ status: "attested" });
    expect(calls.generateKey).toBe(1);
  });
});
