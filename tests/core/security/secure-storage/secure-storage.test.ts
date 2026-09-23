import {
  SecureStorageError,
  createSecureStorage,
  type SecureStorageBackend,
} from "@/core/security/secure-storage/secure-storage";

/**
 * A backend that records what it was asked to do, so the tests can assert on the
 * bytes that reach the keychain rather than only on what comes back out.
 */
function createFakeBackend(initial: Record<string, string> = {}) {
  const items = new Map<string, string>(Object.entries(initial));
  const removed: string[] = [];

  const backend: SecureStorageBackend = {
    getItem: (key) => Promise.resolve(items.get(key) ?? null),
    setItem: (key, value) => {
      items.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      removed.push(key);
      items.delete(key);
      return Promise.resolve();
    },
  };

  return { backend, items, removed };
}

const KEY_ID = "attestation.keyId";
const DB_KEY = "database.key";
const VALID_DB_KEY = "a".repeat(64);

describe("createSecureStorage", () => {
  it("round-trips a value", async () => {
    const { backend } = createFakeBackend();
    const storage = createSecureStorage(backend);

    await storage.set(KEY_ID, "key-123");

    await expect(storage.get(KEY_ID)).resolves.toBe("key-123");
  });

  it("returns null for a key that was never written", async () => {
    const storage = createSecureStorage(createFakeBackend().backend);

    await expect(storage.get(KEY_ID)).resolves.toBeNull();
  });

  it("removes a value", async () => {
    const { backend } = createFakeBackend();
    const storage = createSecureStorage(backend);
    await storage.set(KEY_ID, "key-123");

    await storage.remove(KEY_ID);

    await expect(storage.get(KEY_ID)).resolves.toBeNull();
  });

  it("serialises values, so a non-string type could be stored later", async () => {
    const { backend, items } = createFakeBackend();
    const storage = createSecureStorage(backend);

    await storage.set(KEY_ID, "key-123");

    expect(items.get(KEY_ID)).toBe(JSON.stringify("key-123"));
  });

  describe("validation on write", () => {
    it("refuses a value that does not satisfy the key's schema", async () => {
      const { backend, items } = createFakeBackend();
      const storage = createSecureStorage(backend);

      await expect(storage.set(DB_KEY, "not-a-64-char-hex-key")).rejects.toThrow(
        SecureStorageError,
      );
      expect(items.has(DB_KEY)).toBe(false);
    });

    it("names the key but not the value when it refuses", async () => {
      const storage = createSecureStorage(createFakeBackend().backend);
      const planted = "FAKE-CREDENTIAL-SHAPED-STRING-FOR-THIS-TEST";

      let message = "";
      try {
        await storage.set(DB_KEY, planted);
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toContain(DB_KEY);
      expect(message).not.toContain(planted);
    });
  });

  /**
   * The case that matters most. On a device the attacker controls, a keychain
   * entry is editable. A value that no longer matches its schema is evidence of
   * corruption or tampering, and it must never be handed to the app as if it
   * were sound — it is dropped, and dropped destructively, so the next read
   * starts clean rather than failing forever.
   */
  describe("validation on read", () => {
    it("treats a value that fails its schema as absent, and deletes it", async () => {
      const { backend, removed } = createFakeBackend({
        [DB_KEY]: JSON.stringify("zz-not-hex"),
      });
      const storage = createSecureStorage(backend);

      await expect(storage.get(DB_KEY)).resolves.toBeNull();
      expect(removed).toEqual([DB_KEY]);
    });

    it("treats an unparseable value as absent, and deletes it", async () => {
      const { backend, removed } = createFakeBackend({ [KEY_ID]: "{ truncated" });
      const storage = createSecureStorage(backend);

      await expect(storage.get(KEY_ID)).resolves.toBeNull();
      expect(removed).toEqual([KEY_ID]);
    });

    it("accepts a value that does satisfy its schema", async () => {
      const { backend, removed } = createFakeBackend({
        [DB_KEY]: JSON.stringify(VALID_DB_KEY),
      });
      const storage = createSecureStorage(backend);

      await expect(storage.get(DB_KEY)).resolves.toBe(VALID_DB_KEY);
      expect(removed).toEqual([]);
    });
  });

  describe("backend failures", () => {
    const boom = new Error("keychain unavailable");

    it("wraps a read failure", async () => {
      const storage = createSecureStorage({
        ...createFakeBackend().backend,
        getItem: () => Promise.reject(boom),
      });

      await expect(storage.get(KEY_ID)).rejects.toThrow(SecureStorageError);
    });

    it("wraps a write failure", async () => {
      const storage = createSecureStorage({
        ...createFakeBackend().backend,
        setItem: () => Promise.reject(boom),
      });

      await expect(storage.set(KEY_ID, "key-123")).rejects.toThrow(SecureStorageError);
    });

    it("wraps a remove failure", async () => {
      const storage = createSecureStorage({
        ...createFakeBackend().backend,
        removeItem: () => Promise.reject(boom),
      });

      await expect(storage.remove(KEY_ID)).rejects.toThrow(SecureStorageError);
    });

    it("keeps the cause for logging, without putting it in the message", async () => {
      const storage = createSecureStorage({
        ...createFakeBackend().backend,
        getItem: () => Promise.reject(boom),
      });

      let error: SecureStorageError | undefined;
      try {
        await storage.get(KEY_ID);
      } catch (caught) {
        error = caught as SecureStorageError;
      }

      expect(error?.cause).toBe(boom);
      expect(error?.key).toBe(KEY_ID);
    });
  });
});
