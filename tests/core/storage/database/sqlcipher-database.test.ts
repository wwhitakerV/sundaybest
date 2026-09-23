import {
  DatabaseOpenError,
  openEncryptedDatabase,
} from "@/core/storage/database/sqlcipher-database";

/**
 * `jest.mock` with a factory, so the real `expo-sqlite` is never executed.
 *
 * It has to be this way: `expo-sqlite`'s entry point imports `hooks.tsx`, which
 * requires `expo-asset` — a package installed only nested under `expo/`, which
 * Metro resolves on a device and Jest's resolver does not. Importing the real
 * module here fails with `Cannot find module 'expo-asset'` before any test runs.
 */
const mockExecAsync = jest.fn<Promise<void>, [string]>();
const mockGetAllAsync = jest.fn<Promise<unknown[]>, [string, unknown[]]>();
const mockRunAsync = jest.fn<Promise<unknown>, [string, unknown[]]>();
const mockCloseAsync = jest.fn<Promise<void>, []>();
const mockWithTransactionAsync = jest.fn<Promise<unknown>, [() => Promise<unknown>]>();
const mockOpenDatabaseAsync = jest.fn<Promise<unknown>, [string]>();

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: (name: string): Promise<unknown> => mockOpenDatabaseAsync(name),
}));

const VALID_KEY = "a1b2".repeat(16);

function fakeNativeDatabase() {
  return {
    execAsync: mockExecAsync,
    getAllAsync: mockGetAllAsync,
    runAsync: mockRunAsync,
    closeAsync: mockCloseAsync,
    withTransactionAsync: mockWithTransactionAsync,
  };
}

beforeEach(() => {
  mockOpenDatabaseAsync.mockResolvedValue(fakeNativeDatabase());
  mockExecAsync.mockResolvedValue(undefined);
  mockGetAllAsync.mockResolvedValue([{ count: 0 }]);
  mockRunAsync.mockResolvedValue(undefined);
  mockCloseAsync.mockResolvedValue(undefined);
  mockWithTransactionAsync.mockImplementation((work) => work());
});

describe("openEncryptedDatabase", () => {
  it("keys the database before running anything else", async () => {
    await openEncryptedDatabase("sundaybest.db", VALID_KEY);

    // The PRAGMA has to be the first statement: anything before it runs against
    // an unkeyed handle and fails, or worse, succeeds against a plaintext file.
    expect(mockExecAsync.mock.calls[0]?.[0]).toBe(`PRAGMA key = '${VALID_KEY}'`);
  });

  /**
   * Proving the key actually worked. SQLCipher accepts `PRAGMA key` without
   * complaint and only fails on the *first read*, so without this probe a wrong
   * key would surface much later as a mysterious "file is not a database" in the
   * middle of a feature.
   */
  it("verifies the key by reading from the database", async () => {
    await openEncryptedDatabase("sundaybest.db", VALID_KEY);

    expect(mockGetAllAsync).toHaveBeenCalledWith("SELECT count(*) as count FROM sqlite_master", []);
  });

  it("fails with a clear error when the key does not open the file", async () => {
    mockGetAllAsync.mockRejectedValue(new Error("file is not a database"));

    await expect(openEncryptedDatabase("sundaybest.db", VALID_KEY)).rejects.toThrow(
      DatabaseOpenError,
    );
  });

  it("closes the handle when the key does not work, rather than leaking it", async () => {
    mockGetAllAsync.mockRejectedValue(new Error("file is not a database"));

    await expect(openEncryptedDatabase("sundaybest.db", VALID_KEY)).rejects.toThrow(
      DatabaseOpenError,
    );
    expect(mockCloseAsync).toHaveBeenCalled();
  });

  it("wraps a failure to open the file at all", async () => {
    mockOpenDatabaseAsync.mockRejectedValue(new Error("no such directory"));

    await expect(openEncryptedDatabase("sundaybest.db", VALID_KEY)).rejects.toThrow(
      DatabaseOpenError,
    );
  });

  /**
   * The key is concatenated into a `PRAGMA` statement, because SQLCipher has no
   * parameterised form for it. That makes the key's format a security boundary,
   * not a convenience: a value containing a quote would end the string literal
   * and turn the rest into SQL. It is validated here even though
   * `database-key.ts` already generates it as hex — the whole point of defence in
   * depth is not trusting the other end to have stayed correct.
   */
  describe("key validation", () => {
    it.each([
      ["a quote", `a'; DROP TABLE x; --${"0".repeat(40)}`],
      ["upper-case hex", "A1B2".repeat(16)],
      ["too short", "ab".repeat(16)],
      ["too long", "ab".repeat(40)],
      ["non-hex characters", "z".repeat(64)],
      ["empty", ""],
    ])("refuses %s", async (_label, key) => {
      await expect(openEncryptedDatabase("sundaybest.db", key)).rejects.toThrow(DatabaseOpenError);
      expect(mockOpenDatabaseAsync).not.toHaveBeenCalled();
    });

    it("never puts the key in the error message", async () => {
      let message = "";
      try {
        await openEncryptedDatabase("sundaybest.db", "deadbeef");
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).not.toContain("deadbeef");
      expect(message).toContain("64 lowercase hex");
    });
  });
});

describe("the adapter", () => {
  it("runs statements through runAsync", async () => {
    const db = await openEncryptedDatabase("sundaybest.db", VALID_KEY);

    await db.execute("INSERT INTO notes (body) VALUES (?)", ["hello"]);

    expect(mockRunAsync).toHaveBeenCalledWith("INSERT INTO notes (body) VALUES (?)", ["hello"]);
  });

  it("returns rows unparsed, for the caller to validate", async () => {
    mockGetAllAsync.mockResolvedValue([{ id: 1 }]);
    const db = await openEncryptedDatabase("sundaybest.db", VALID_KEY);

    await expect(db.query("SELECT * FROM notes")).resolves.toEqual([{ id: 1 }]);
  });

  it("binds an empty parameter list when none is given", async () => {
    const db = await openEncryptedDatabase("sundaybest.db", VALID_KEY);
    mockRunAsync.mockClear();

    await db.execute("VACUUM");

    expect(mockRunAsync).toHaveBeenCalledWith("VACUUM", []);
  });

  it("delegates transactions to expo-sqlite", async () => {
    const db = await openEncryptedDatabase("sundaybest.db", VALID_KEY);

    await expect(db.transaction(() => Promise.resolve("done"))).resolves.toBe("done");
    expect(mockWithTransactionAsync).toHaveBeenCalled();
  });

  it("propagates a failure out of a transaction so it rolls back", async () => {
    mockWithTransactionAsync.mockImplementation((work) => work());
    const db = await openEncryptedDatabase("sundaybest.db", VALID_KEY);

    await expect(
      db.transaction(() => Promise.reject(new Error("constraint failed"))),
    ).rejects.toThrow("constraint failed");
  });

  it("closes", async () => {
    const db = await openEncryptedDatabase("sundaybest.db", VALID_KEY);

    await db.close();

    expect(mockCloseAsync).toHaveBeenCalled();
  });
});
