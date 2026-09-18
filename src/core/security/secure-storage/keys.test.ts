import { SECURE_STORAGE_KEYS, schemaFor, type SecureStorageKey } from "./keys";

describe("the key registry", () => {
  it("declares the keys the app actually uses", () => {
    expect([...SECURE_STORAGE_KEYS].sort()).toEqual([
      "attestation.keyId",
      "database.key",
      "session.refreshToken",
    ]);
  });

  it("has a schema for every declared key", () => {
    for (const key of SECURE_STORAGE_KEYS) {
      expect(schemaFor(key)).toBeDefined();
    }
  });

  /**
   * Unreachable through the typed API, and tested anyway. If the key union and
   * the schema registry ever drift apart, the alternative to this throw is a
   * read that silently skips validation — which is the one thing secure storage
   * exists to prevent.
   */
  it("refuses to hand back a schema for a key it does not know", () => {
    const unregistered = "attestation.notAThing" as SecureStorageKey;

    expect(() => schemaFor(unregistered)).toThrow(/No schema registered/);
  });
});
