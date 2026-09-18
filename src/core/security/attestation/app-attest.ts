import { toApiError } from "../../api/api-error";
import type { SecureStorage } from "../secure-storage/secure-storage";
import type {
  AppAttestDevice,
  AssertionResult,
  Attestation,
  AttestationApi,
  AttestationResult,
  AttestationStage,
  FailureCode,
} from "./attestation";

const STORED_KEY = "attestation.keyId";

export interface AppAttestationDeps {
  api: AttestationApi;
  device: AppAttestDevice;
  secureStorage: SecureStorage;
  /** From `flags.isEnabled("attestation")`, i.e. `EXPO_PUBLIC_ATTESTATION_ENABLED`. */
  enabled: boolean;
}

/**
 * App Attest, wired to the backend contract.
 *
 * The flow, once per install:
 *
 *   challenge → check support → generate key → attest key → verify with the
 *   server → store the keyId
 *
 * and then, per sensitive request:
 *
 *   challenge → assert
 *
 * Failures are classified rather than thrown. The `transient` / `rejected`
 * split comes straight from the error table in
 * [docs/api/attestation.md](../../../../docs/api/attestation.md): a caller may
 * retry `transient` with backoff and must not loop on `rejected`.
 */
export function createAppAttestation({
  api,
  device,
  secureStorage,
  enabled,
}: AppAttestationDeps): Attestation {
  /**
   * Classifies anything thrown by the API port.
   *
   * A device/keychain error is reported as a transient `DEVICE_ERROR` rather
   * than mapped onto a server code, so a log never claims the backend said
   * something it did not.
   */
  function classify(stage: AttestationStage, cause: unknown): AttestationResult & AssertionResult {
    const error = toApiError(cause);

    return {
      status: error.retryable ? "transient" : "rejected",
      stage,
      code: error.code,
    };
  }

  function deviceFailure(stage: AttestationStage): {
    status: "transient";
    stage: AttestationStage;
    code: FailureCode;
  } {
    return { status: "transient", stage, code: "DEVICE_ERROR" };
  }

  async function readStoredKeyId(): Promise<string | null> {
    return secureStorage.get(STORED_KEY);
  }

  return {
    async attest(): Promise<AttestationResult> {
      if (!enabled) return { status: "disabled" };

      let existing: string | null;
      try {
        existing = await readStoredKeyId();
      } catch {
        return deviceFailure("challenge");
      }

      // Apple caps how many App Attest keys an install may create, so an
      // already-attested install must not run the flow again.
      if (existing !== null) return { status: "already-attested", keyId: existing };

      const support = device.support();
      if (!support.supported) {
        return { status: "unsupported", reason: support.reason };
      }

      let challenge: string;
      try {
        challenge = (await api.requestChallenge()).challenge;
      } catch (cause) {
        return classify("challenge", cause);
      }

      let keyId: string;
      try {
        keyId = await device.generateKey();
      } catch {
        return deviceFailure("key-generation");
      }

      let attestation: string;
      try {
        attestation = await device.attestKey(keyId, challenge);
      } catch {
        return deviceFailure("attest");
      }

      let credentials;
      try {
        credentials = await api.verifyAttestation({ keyId, attestation, challenge });
      } catch (cause) {
        return classify("verify", cause);
      }

      // Stored only now that the server has accepted it. The other order leaves
      // an install holding a key the backend has never heard of.
      try {
        await secureStorage.set(STORED_KEY, keyId);
      } catch {
        return deviceFailure("verify");
      }

      return { status: "attested", keyId, credentials };
    },

    async createAssertion(): Promise<AssertionResult> {
      if (!enabled) return { status: "disabled" };

      let keyId: string | null;
      try {
        keyId = await readStoredKeyId();
      } catch {
        return deviceFailure("challenge");
      }

      if (keyId === null) return { status: "needs-attestation" };

      const support = device.support();
      if (!support.supported) {
        return { status: "unsupported", reason: support.reason };
      }

      let challenge: string;
      try {
        challenge = (await api.requestChallenge(keyId)).challenge;
      } catch (cause) {
        const error = toApiError(cause);

        // The server has no record of this key, so the stored one is useless.
        // Dropping it turns a permanent failure into a re-attestation.
        if (error.code === "KEY_UNKNOWN") {
          await forget(secureStorage);
          return { status: "needs-attestation" };
        }

        // KEY_REVOKED is the opposite: the server knows this install and has
        // decided against it. Re-attesting would mint another key for the same
        // device and burn Apple's per-install budget doing it.
        return classify("challenge", error);
      }

      let assertion: string;
      try {
        assertion = await device.createAssertion(keyId, challenge);
      } catch {
        return deviceFailure("assert");
      }

      return { status: "ok", keyId, assertion, challenge };
    },

    async reset(): Promise<void> {
      await forget(secureStorage);
    },
  };
}

/**
 * Drops the stored key id.
 *
 * A failure is swallowed: every caller is already on a path that treats the key
 * as unusable, and turning a failed cleanup into a thrown error would remove the
 * recovery this exists to provide.
 */
async function forget(secureStorage: SecureStorage): Promise<void> {
  try {
    await secureStorage.remove(STORED_KEY);
  } catch {
    // Intentionally ignored — see above.
  }
}
