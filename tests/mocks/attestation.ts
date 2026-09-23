import type {
  AppAttestDevice,
  Attestation,
  AttestationApi,
  AssertionResult,
  AttestationResult,
  DeviceSupport,
} from "@/core/security/attestation/attestation";
import type { SessionCredentials } from "@/core/api/contracts/attestation";

/** A challenge long enough to satisfy `challengeResponseSchema` (32+ chars). */
export const FAKE_CHALLENGE = "0f8f".repeat(10);
export const FAKE_KEY_ID = "fake-key-id";
export const FAKE_ATTESTATION = "fake-attestation-blob-long-enough";
export const FAKE_ASSERTION = "fake-assertion-blob-long-enough";

export const FAKE_CREDENTIALS: SessionCredentials = {
  accessToken: "fake-access-token",
  refreshToken: "fake-refresh-token",
  expiresIn: 900,
};

/**
 * A Secure Enclave that always cooperates, and records what it was asked.
 *
 * Override any member to model a failure:
 *
 *     createFakeAppAttestDevice({ support: () => ({ supported: false, reason: "platform" }) })
 */
export function createFakeAppAttestDevice(overrides: Partial<AppAttestDevice> = {}) {
  const calls: { generateKey: number; attestKey: number; createAssertion: number } = {
    generateKey: 0,
    attestKey: 0,
    createAssertion: 0,
  };

  const device: AppAttestDevice = {
    support: (): DeviceSupport => ({ supported: true }),
    generateKey: () => {
      calls.generateKey += 1;
      return Promise.resolve(FAKE_KEY_ID);
    },
    attestKey: () => {
      calls.attestKey += 1;
      return Promise.resolve(FAKE_ATTESTATION);
    },
    createAssertion: () => {
      calls.createAssertion += 1;
      return Promise.resolve(FAKE_ASSERTION);
    },
    ...overrides,
  };

  return { device, calls };
}

/** A backend that honours the contract. Override a member to model a failure. */
export function createFakeAttestationApi(overrides: Partial<AttestationApi> = {}) {
  const requests: { challengeKeyIds: (string | undefined)[]; verified: unknown[] } = {
    challengeKeyIds: [],
    verified: [],
  };

  const api: AttestationApi = {
    requestChallenge: (keyId) => {
      requests.challengeKeyIds.push(keyId);
      return Promise.resolve({
        challenge: FAKE_CHALLENGE,
        expiresAt: new Date(Date.now() + 120_000).toISOString(),
      });
    },
    verifyAttestation: (request) => {
      requests.verified.push(request);
      return Promise.resolve(FAKE_CREDENTIALS);
    },
    ...overrides,
  };

  return { api, requests };
}

/**
 * An `Attestation` that reports a fixed outcome.
 *
 * For tests of code that *depends on* attestation — the session manager, and
 * later any request that needs an assertion — so they never have to assemble a
 * device, an API, and a keychain just to get a canned answer.
 */
export function createFakeAttestation(
  // `| undefined` rather than just optional, because exactOptionalPropertyTypes
  // is on and callers pass these through from their own optional options.
  overrides: {
    attest?: AttestationResult | undefined;
    assertion?: AssertionResult | undefined;
  } = {},
) {
  const calls = { attest: 0, createAssertion: 0, reset: 0 };

  const attestation: Attestation = {
    attest: () => {
      calls.attest += 1;
      return Promise.resolve(
        overrides.attest ?? { status: "already-attested", keyId: FAKE_KEY_ID },
      );
    },
    createAssertion: () => {
      calls.createAssertion += 1;
      return Promise.resolve(
        overrides.assertion ?? {
          status: "ok",
          keyId: FAKE_KEY_ID,
          assertion: FAKE_ASSERTION,
          challenge: FAKE_CHALLENGE,
        },
      );
    },
    reset: () => {
      calls.reset += 1;
      return Promise.resolve();
    },
  };

  return { attestation, calls };
}
