import {
  createSecureStorage,
  type SecureStorage,
  type SecureStorageBackend,
} from "@/core/security/secure-storage/secure-storage";

export interface InMemorySecureStorage extends SecureStorage {
  /** The raw stored strings, as the keychain would hold them. */
  readonly items: Map<string, string>;
  /** Puts a raw string in directly, bypassing validation, to simulate tampering. */
  poke(key: string, rawValue: string): void;
}

/**
 * An in-memory stand-in for the keychain.
 *
 * It wraps the **real** `createSecureStorage`, so the fake enforces the same
 * schema validation, the same delete-on-invalid behaviour, and the same error
 * type as production. A hand-written fake would inevitably be more permissive
 * than the thing it stands for, and tests would pass against behaviour the app
 * does not have.
 *
 * `poke` exists for the one thing a well-behaved fake cannot express: a value
 * that is already in the keychain and should not be trusted.
 */
export function createInMemorySecureStorage(
  initial: Readonly<Record<string, string>> = {},
): InMemorySecureStorage {
  const items = new Map<string, string>(Object.entries(initial));

  const backend: SecureStorageBackend = {
    getItem: (key) => Promise.resolve(items.get(key) ?? null),
    setItem: (key, value) => {
      items.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      items.delete(key);
      return Promise.resolve();
    },
  };

  return {
    ...createSecureStorage(backend),
    items,
    poke(key, rawValue) {
      items.set(key, rawValue);
    },
  };
}

/** A backend whose every operation rejects, for testing failure paths. */
export function createFailingSecureStorageBackend(cause = new Error("keychain unavailable")) {
  const reject = () => Promise.reject(cause);

  const backend: SecureStorageBackend = {
    getItem: reject,
    setItem: reject,
    removeItem: reject,
  };

  return { backend, cause };
}
