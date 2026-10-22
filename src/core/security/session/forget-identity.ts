import type { SecureStorage } from "../secure-storage/secure-storage";
import type { SecureStorageKey } from "../secure-storage/keys";

/**
 * What says who this install is to the server: the development install id,
 * or App Attest's key and the session's refresh token — and the user the
 * offline cache was kept for. Never `database.key`: the phone's database
 * stays readable.
 */
const IDENTITY_KEYS = [
  "development.installationId",
  "attestation.keyId",
  "session.refreshToken",
  "offline.currentUserId",
] as const satisfies readonly SecureStorageKey[];

/**
 * Forgets who this install is, so the next launch is a new anonymous reader
 * to the server. Development's "Start over" only (ADR 0035): the keychain
 * survives deleting the app, so without this a reinstall comes back as the
 * same reader.
 */
export async function forgetReaderIdentity(secureStorage: SecureStorage): Promise<void> {
  for (const key of IDENTITY_KEYS) {
    await secureStorage.remove(key);
  }
}
