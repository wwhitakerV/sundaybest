import type { SecureStorage } from "../secure-storage/secure-storage";

/** 256 bits. SQLCipher's key size, and the reason the schema wants 64 hex chars. */
const KEY_BYTES = 32;

const STORED_KEY = "database.key";

export class DatabaseKeyError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "DatabaseKeyError";
    Object.setPrototypeOf(this, DatabaseKeyError.prototype);
  }
}

export interface DatabaseKeyDeps {
  secureStorage: SecureStorage;
  /** `expo-crypto`'s `getRandomBytesAsync`, injected so tests need no native module. */
  randomBytes: (byteCount: number) => Promise<Uint8Array>;
}

export interface DatabaseKeyProvider {
  /**
   * The database key, generating and storing one on first launch.
   *
   * Rejects with `DatabaseKeyError` rather than returning a weak key. There is
   * no fallback: a database that opens with predictable key material is worse
   * than one that does not open, because it looks encrypted and is not.
   */
  get(): Promise<string>;
}

/**
 * Provisions the SQLCipher key.
 *
 * The key is generated on the device, on first launch, and never leaves it — it
 * is not derived from anything (a device identifier, a bundle ID, a constant),
 * because a derived key is only as unguessable as its inputs, and all of those
 * inputs are readable by an attacker holding the phone.
 *
 * It lives in `security/` rather than beside the database adapter because this
 * is key management (MASVS-CRYPTO-2), and it is held to the stricter coverage
 * bar that applies to `src/core/security`.
 */
export function createDatabaseKeyProvider({
  secureStorage,
  randomBytes,
}: DatabaseKeyDeps): DatabaseKeyProvider {
  // Single-flight. Two concurrent provisioning runs would each generate a key
  // and both would write; whichever lost the race would hand its caller a key
  // that no longer opens the database, leaving an encrypted file nothing can
  // read. The promise is cleared on failure so a retry is still possible.
  let inFlight: Promise<string> | null = null;

  async function provision(): Promise<string> {
    let existing: string | null;
    try {
      existing = await secureStorage.get(STORED_KEY);
    } catch (cause) {
      throw new DatabaseKeyError("Could not read the database key from secure storage.", cause);
    }

    if (existing !== null) return existing;

    let bytes: Uint8Array;
    try {
      bytes = await randomBytes(KEY_BYTES);
    } catch (cause) {
      throw new DatabaseKeyError("Could not generate a database key.", cause);
    }

    assertUsableKeyMaterial(bytes);

    const key = toHex(bytes);

    try {
      await secureStorage.set(STORED_KEY, key);
    } catch (cause) {
      throw new DatabaseKeyError("Could not store the database key.", cause);
    }

    return key;
  }

  return {
    get() {
      inFlight ??= provision().finally(() => {
        inFlight = null;
      });

      return inFlight;
    },
  };
}

/**
 * Sanity-checks the random source before its output becomes a key.
 *
 * Both checks are for a broken or stubbed platform rather than an attacker: a
 * short read and an all-zero buffer are the two ways a random source fails
 * without erroring, and either would produce a database that is encrypted with
 * a known key. Cheap to check, catastrophic to miss.
 */
function assertUsableKeyMaterial(bytes: Uint8Array): void {
  if (bytes.length !== KEY_BYTES) {
    throw new DatabaseKeyError(
      `The random source returned ${bytes.length} bytes; the database key needs 32 bytes.`,
    );
  }

  if (bytes.every((byte) => byte === 0)) {
    throw new DatabaseKeyError(
      "The random source returned 32 bytes of zeroes, which is not usable key material.",
    );
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
