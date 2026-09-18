import { schemaFor, type SecureStorageKey, type SecureStorageValue } from "./keys";

/**
 * Keychain-backed storage for the app's secrets.
 *
 * Keys are a closed union and every value is validated against that key's schema
 * on the way in and on the way out. See `keys.ts` for the registry and
 * `expo-secure-storage.ts` for the iOS keychain adapter and its fixed
 * accessibility policy.
 */
export interface SecureStorage {
  /**
   * The stored value, or `null` if there is none.
   *
   * A value that fails its schema is reported as `null` **and deleted** — see
   * the note on `createSecureStorage`.
   */
  get<K extends SecureStorageKey>(key: K): Promise<SecureStorageValue<K> | null>;

  /** Rejects with `SecureStorageError` rather than storing an invalid value. */
  set<K extends SecureStorageKey>(key: K, value: SecureStorageValue<K>): Promise<void>;

  remove(key: SecureStorageKey): Promise<void>;
}

/**
 * The native seam: raw strings in and out, no validation, no policy decisions.
 *
 * Keeping it this narrow means every rule above is testable against an in-memory
 * fake, and the only untested-by-unit-test part is the handful of lines that
 * actually call the keychain.
 */
export interface SecureStorageBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type SecureStorageOperation = "read" | "write" | "delete" | "validate";

/**
 * A secure storage failure.
 *
 * The message carries the key and the operation and **never the value**: these
 * messages end up in logs and crash reports, and a value that failed validation
 * is exactly the kind of thing someone has just pasted into the wrong place. The
 * original error is kept on `cause` for a debugger, not for a log line.
 */
export class SecureStorageError extends Error {
  readonly key: SecureStorageKey;
  readonly operation: SecureStorageOperation;

  constructor(operation: SecureStorageOperation, key: SecureStorageKey, cause?: unknown) {
    super(`Secure storage ${operation} failed for "${key}".`, { cause });
    this.name = "SecureStorageError";
    this.key = key;
    this.operation = operation;
    Object.setPrototypeOf(this, SecureStorageError.prototype);
  }
}

/**
 * Wraps a backend with the key registry's validation.
 *
 * The one judgement call worth knowing about: **an invalid stored value is
 * deleted, not returned and not thrown over.** On a device its owner controls,
 * keychain entries are editable, so a value that no longer matches its schema is
 * either corruption or tampering. Returning it would let attacker-chosen data
 * into the app; throwing would leave the app permanently broken with no way back
 * short of a reinstall. Deleting it means the caller sees "nothing stored" and
 * re-provisions, which is a state the app already has to handle for first launch.
 */
export function createSecureStorage(backend: SecureStorageBackend): SecureStorage {
  return {
    async get<K extends SecureStorageKey>(key: K): Promise<SecureStorageValue<K> | null> {
      let raw: string | null;
      try {
        raw = await backend.getItem(key);
      } catch (cause) {
        throw new SecureStorageError("read", key, cause);
      }

      if (raw === null) return null;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        await discard(backend, key);
        return null;
      }

      const result = schemaFor(key).safeParse(parsed);
      if (!result.success) {
        await discard(backend, key);
        return null;
      }

      return result.data as SecureStorageValue<K>;
    },

    async set<K extends SecureStorageKey>(key: K, value: SecureStorageValue<K>): Promise<void> {
      // Validate before writing. Storing something the reader will reject just
      // moves the failure to a later, more confusing place.
      if (!schemaFor(key).safeParse(value).success) {
        throw new SecureStorageError("validate", key);
      }

      try {
        await backend.setItem(key, JSON.stringify(value));
      } catch (cause) {
        throw new SecureStorageError("write", key, cause);
      }
    },

    async remove(key: SecureStorageKey): Promise<void> {
      try {
        await backend.removeItem(key);
      } catch (cause) {
        throw new SecureStorageError("delete", key, cause);
      }
    },
  };
}

/**
 * Deletes an entry we have decided not to trust.
 *
 * A failure here is swallowed on purpose: the caller is already being told
 * "nothing is stored", and turning a failed cleanup into a thrown error would
 * take away the recovery path that dropping the value exists to provide.
 */
async function discard(backend: SecureStorageBackend, key: SecureStorageKey): Promise<void> {
  try {
    await backend.removeItem(key);
  } catch {
    // Intentionally ignored — see above.
  }
}
