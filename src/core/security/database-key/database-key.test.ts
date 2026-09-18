import { createInMemorySecureStorage } from "@test/mocks/secure-storage";

import { DatabaseKeyError, createDatabaseKeyProvider } from "./database-key";

const STORED_KEY = "database.key";

/** Deterministic bytes, so the expected hex is spelled out rather than computed. */
function fixedRandomBytes(byteCount: number): Promise<Uint8Array> {
  return Promise.resolve(new Uint8Array(byteCount).fill(0xab));
}

describe("createDatabaseKeyProvider", () => {
  it("generates a key on first launch and stores it", async () => {
    const secureStorage = createInMemorySecureStorage();
    const provider = createDatabaseKeyProvider({ secureStorage, randomBytes: fixedRandomBytes });

    const key = await provider.get();

    expect(key).toBe("ab".repeat(32));
    await expect(secureStorage.get(STORED_KEY)).resolves.toBe(key);
  });

  it("asks for 32 bytes — a 256-bit key", async () => {
    const randomBytes = jest.fn(fixedRandomBytes);
    const provider = createDatabaseKeyProvider({
      secureStorage: createInMemorySecureStorage(),
      randomBytes,
    });

    await provider.get();

    expect(randomBytes).toHaveBeenCalledWith(32);
  });

  it("returns the stored key on later launches, without generating a new one", async () => {
    const existing = "1f".repeat(32);
    const secureStorage = createInMemorySecureStorage({
      [STORED_KEY]: JSON.stringify(existing),
    });
    const randomBytes = jest.fn(fixedRandomBytes);
    const provider = createDatabaseKeyProvider({ secureStorage, randomBytes });

    await expect(provider.get()).resolves.toBe(existing);
    expect(randomBytes).not.toHaveBeenCalled();
  });

  /**
   * The failure this prevents is data loss, not a leak. Two concurrent
   * provisioning runs would each generate a key, both would write, and the
   * loser's caller would hold a key that no longer opens the database — leaving
   * an encrypted file nothing on the device can read.
   */
  it("provisions once when called concurrently", async () => {
    const randomBytes = jest.fn(fixedRandomBytes);
    const provider = createDatabaseKeyProvider({
      secureStorage: createInMemorySecureStorage(),
      randomBytes,
    });

    const keys = await Promise.all([provider.get(), provider.get(), provider.get()]);

    expect(randomBytes).toHaveBeenCalledTimes(1);
    expect(new Set(keys).size).toBe(1);
  });

  it("allows a retry after a failure, rather than caching the rejection", async () => {
    const randomBytes = jest
      .fn<Promise<Uint8Array>, [number]>()
      .mockRejectedValueOnce(new Error("no entropy"))
      .mockImplementation(fixedRandomBytes);
    const provider = createDatabaseKeyProvider({
      secureStorage: createInMemorySecureStorage(),
      randomBytes,
    });

    await expect(provider.get()).rejects.toThrow(DatabaseKeyError);
    await expect(provider.get()).resolves.toBe("ab".repeat(32));
  });

  describe("refuses to proceed with weak material", () => {
    it("rejects a short read from the random source", async () => {
      const provider = createDatabaseKeyProvider({
        secureStorage: createInMemorySecureStorage(),
        randomBytes: () => Promise.resolve(new Uint8Array(16).fill(1)),
      });

      await expect(provider.get()).rejects.toThrow(DatabaseKeyError);
    });

    it("rejects all-zero bytes, which is what a broken source returns", async () => {
      const provider = createDatabaseKeyProvider({
        secureStorage: createInMemorySecureStorage(),
        randomBytes: () => Promise.resolve(new Uint8Array(32)),
      });

      await expect(provider.get()).rejects.toThrow(DatabaseKeyError);
    });

    it("never puts key material in the error message", async () => {
      const provider = createDatabaseKeyProvider({
        secureStorage: createInMemorySecureStorage(),
        randomBytes: () => Promise.resolve(new Uint8Array(16).fill(0xcd)),
      });

      let message = "";
      try {
        await provider.get();
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).not.toContain("cd");
      expect(message).toContain("32 bytes");
    });
  });

  it("wraps a keychain write failure, rather than returning an unstored key", async () => {
    const provider = createDatabaseKeyProvider({
      secureStorage: {
        get: () => Promise.resolve(null),
        set: () => Promise.reject(new Error("keychain unavailable")),
        remove: () => Promise.resolve(),
      },
      randomBytes: fixedRandomBytes,
    });

    // Returning the key anyway would open the database with a key that is not
    // written down, so the next launch could never open it again.
    await expect(provider.get()).rejects.toThrow(DatabaseKeyError);
  });

  it("wraps a keychain failure", async () => {
    const provider = createDatabaseKeyProvider({
      secureStorage: {
        get: () => Promise.reject(new Error("keychain unavailable")),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
      },
      randomBytes: fixedRandomBytes,
    });

    await expect(provider.get()).rejects.toThrow(DatabaseKeyError);
  });
});
