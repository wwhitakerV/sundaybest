import { z } from "zod";

/**
 * Every secret the app stores, and the shape each one must have.
 *
 * This object is the single source of truth: the key union, the value types, and
 * the runtime validation all derive from it, so a key cannot exist without a
 * schema and a schema cannot exist for a key nobody declared. Free-form string
 * keys are what lets a typo write a secret to a slot nothing ever reads.
 *
 * Keys are namespaced `area.name` and are part of the app's on-device contract:
 * renaming one orphans whatever is already in the keychain on every existing
 * install, so a rename needs a migration, not just an edit.
 */
const SECURE_STORAGE_SCHEMAS = {
  /** App Attest key identifier. Not a secret, but it identifies this install. */
  "attestation.keyId": z.string().min(1).max(512),

  /** SQLCipher key: 32 random bytes, lowercase hex. */
  "database.key": z
    .string()
    .regex(/^[0-9a-f]{64}$/, "expected 64 lowercase hex characters (32 bytes)"),

  /** Session refresh token. Rotated on every use. */
  "session.refreshToken": z.string().min(1).max(4096),
} as const;

export type SecureStorageKey = keyof typeof SECURE_STORAGE_SCHEMAS;

/** The type stored under a given key. */
export type SecureStorageValue<K extends SecureStorageKey> = z.infer<
  (typeof SECURE_STORAGE_SCHEMAS)[K]
>;

/**
 * Runtime lookup goes through a Map rather than indexing the object with a
 * variable, which keeps it off `security/detect-object-injection` — the rule is
 * right in general, and a Map is the honest way to say "dynamic lookup by key".
 */
const SCHEMAS_BY_KEY: ReadonlyMap<string, z.ZodType> = new Map(
  Object.entries(SECURE_STORAGE_SCHEMAS),
);

export function schemaFor(key: SecureStorageKey): z.ZodType {
  const schema = SCHEMAS_BY_KEY.get(key);

  // Unreachable through the typed API; a real failure here would mean the
  // registry and the key union had drifted apart, which is worth a loud error
  // rather than a silent unvalidated read.
  if (schema === undefined) {
    throw new Error(`No schema registered for secure storage key: ${key}`);
  }

  return schema;
}

/** Every declared key. Exported for tests that want to sweep all of them. */
export const SECURE_STORAGE_KEYS = Object.keys(SECURE_STORAGE_SCHEMAS) as SecureStorageKey[];
