import * as SecureStore from "expo-secure-store";

import {
  KEYCHAIN_OPTIONS,
  createExpoSecureStorage,
} from "@/core/security/secure-storage/expo-secure-storage";

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const getItemAsync = jest.mocked(SecureStore.getItemAsync);
const setItemAsync = jest.mocked(SecureStore.setItemAsync);
const deleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);

describe("createExpoSecureStorage", () => {
  /**
   * The policy is the point of this adapter. `WHEN_UNLOCKED_THIS_DEVICE_ONLY`
   * keeps secrets out of iCloud Keychain and out of device backups, and makes
   * them unreadable while the device is locked. A call site that forgot the
   * option would silently fall back to expo-secure-store's default of
   * `WHEN_UNLOCKED` — readable after restore onto another device — so the option
   * comes from one constant and every call gets it.
   */
  it("pins the accessibility policy to unlocked-and-this-device-only", () => {
    expect(KEYCHAIN_OPTIONS).toEqual({
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  });

  it("reads with the pinned policy", async () => {
    getItemAsync.mockResolvedValue(JSON.stringify("key-123"));

    await expect(createExpoSecureStorage().get("attestation.keyId")).resolves.toBe("key-123");
    expect(getItemAsync).toHaveBeenCalledWith("attestation.keyId", KEYCHAIN_OPTIONS);
  });

  it("writes with the pinned policy", async () => {
    setItemAsync.mockResolvedValue(undefined);

    await createExpoSecureStorage().set("attestation.keyId", "key-123");

    expect(setItemAsync).toHaveBeenCalledWith(
      "attestation.keyId",
      JSON.stringify("key-123"),
      KEYCHAIN_OPTIONS,
    );
  });

  it("deletes with the pinned policy", async () => {
    deleteItemAsync.mockResolvedValue(undefined);

    await createExpoSecureStorage().remove("attestation.keyId");

    expect(deleteItemAsync).toHaveBeenCalledWith("attestation.keyId", KEYCHAIN_OPTIONS);
  });

  it("goes through the validating wrapper, not straight to the keychain", async () => {
    getItemAsync.mockResolvedValue(JSON.stringify("nope"));
    deleteItemAsync.mockResolvedValue(undefined);

    // "database.key" requires 64 hex characters, so this read must come back
    // empty and clean up after itself.
    await expect(createExpoSecureStorage().get("database.key")).resolves.toBeNull();
    expect(deleteItemAsync).toHaveBeenCalledWith("database.key", KEYCHAIN_OPTIONS);
  });
});
