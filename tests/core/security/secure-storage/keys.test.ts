import {
  SECURE_STORAGE_KEYS,
  schemaFor,
  type SecureStorageKey,
} from "@/core/security/secure-storage/keys";

describe("the key registry", () => {
  it("declares the keys the app actually uses", () => {
    expect([...SECURE_STORAGE_KEYS].sort()).toEqual([
      "attestation.keyId",
      "database.key",
      "development.installationId",
      "offline.currentUserId",
      "session.refreshToken",
    ]);
  });

  // The offline cache's owner: without it, saving /me's user threw after every
  // successful lookup and launch failed (or fell back to Welcome).
  it("keeps the offline cache's user id, and only as a uuid", () => {
    const schema = schemaFor("offline.currentUserId");

    expect(schema.safeParse("4bca81ef-a008-49d6-a0c4-d83974fb0241").success).toBe(true);
    expect(schema.safeParse("not-a-user").success).toBe(false);
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
