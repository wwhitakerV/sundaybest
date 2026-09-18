import * as SecureStore from "expo-secure-store";

import {
  createSecureStorage,
  type SecureStorage,
  type SecureStorageBackend,
} from "./secure-storage";

/**
 * The keychain accessibility policy, in one place.
 *
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY` means:
 *
 * - **unlocked** — the item cannot be read while the device is locked, so a
 *   secret is not sitting available to background code on a locked phone;
 * - **this device only** — the item is excluded from iCloud Keychain sync *and*
 *   from encrypted device backups, so restoring a backup onto another device
 *   does not carry the database key or the refresh token with it.
 *
 * expo-secure-store defaults to `WHEN_UNLOCKED`, which is backed up and
 * restorable elsewhere. A single forgotten option at one call site would be that
 * weaker policy with no visible difference, so there is exactly one constant and
 * the adapter applies it to every call. Do not add a per-call override.
 *
 * `requireAuthentication` is deliberately not used: it would put a Face ID prompt
 * in front of the app's own bootstrap, and `NSFaceIDUsageDescription` is switched
 * off in `app.config.ts` to match.
 */
export const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const backend: SecureStorageBackend = {
  getItem: (key) => SecureStore.getItemAsync(key, KEYCHAIN_OPTIONS),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, KEYCHAIN_OPTIONS),
  removeItem: (key) => SecureStore.deleteItemAsync(key, KEYCHAIN_OPTIONS),
};

/** The app's secure storage, backed by the iOS keychain. */
export function createExpoSecureStorage(): SecureStorage {
  return createSecureStorage(backend);
}
