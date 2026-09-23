import { createFakeDatabase } from "@tests/mocks/database";

import type { Database } from "@/core/storage/database/database";
import {
  MIGRATIONS,
  MigrationError,
  runMigrations,
  type Migration,
} from "@/core/storage/database/migrations";

function migration(version: number, name: string, up?: (db: Database) => Promise<void>): Migration {
  return {
    version,
    name,
    up: up ?? ((db) => db.execute(`-- ${name}`)),
  };
}

describe("MIGRATIONS", () => {
  /**
   * Prompt 7 builds the runner, not a schema. An empty list is the correct
   * content, and this test is here so adding the first migration is a deliberate
   * act that updates a test rather than a silent append.
   */
  it("is empty — there are no tables yet", () => {
    expect(MIGRATIONS).toEqual([]);
  });
});

describe("runMigrations", () => {
  it("does nothing to a fresh database when there are no migrations", async () => {
    const db = createFakeDatabase();

    await expect(runMigrations(db, [])).resolves.toEqual({ from: 0, to: 0, applied: [] });
    expect(db.transactions.started).toBe(0);
  });

  it("applies every migration in order and reports what it did", async () => {
    const db = createFakeDatabase();

    const outcome = await runMigrations(db, [
      migration(1, "create_notes"),
      migration(2, "add_notes_index"),
    ]);

    expect(outcome).toEqual({ from: 0, to: 2, applied: ["create_notes", "add_notes_index"] });
    expect(db.statements.map((s) => s.sql)).toEqual([
      "PRAGMA user_version",
      "-- create_notes",
      "PRAGMA user_version = 1",
      "-- add_notes_index",
      "PRAGMA user_version = 2",
    ]);
  });

  it("skips migrations the database already has", async () => {
    const db = createFakeDatabase({ userVersion: 1 });

    const outcome = await runMigrations(db, [
      migration(1, "create_notes"),
      migration(2, "add_notes_index"),
    ]);

    expect(outcome).toEqual({ from: 1, to: 2, applied: ["add_notes_index"] });
    expect(db.statements.map((s) => s.sql)).not.toContain("-- create_notes");
  });

  it("does nothing when the database is already up to date", async () => {
    const db = createFakeDatabase({ userVersion: 2 });

    await expect(runMigrations(db, [migration(1, "a"), migration(2, "b")])).resolves.toEqual({
      from: 2,
      to: 2,
      applied: [],
    });
    expect(db.transactions.started).toBe(0);
  });

  /**
   * Each migration and its version bump go in one transaction. Without that, a
   * crash between the DDL and the `PRAGMA user_version` would leave a database
   * whose schema has changed but whose version says it has not — so the next
   * launch reapplies a migration against a table that already exists, and the
   * app is bricked in a way a reinstall is the only way out of.
   */
  it("wraps each migration and its version bump in one transaction", async () => {
    const db = createFakeDatabase();

    await runMigrations(db, [migration(1, "a"), migration(2, "b")]);

    expect(db.transactions).toEqual({ started: 2, committed: 2, rolledBack: 0 });
  });

  describe("when a migration fails", () => {
    it("rolls back and does not advance the version", async () => {
      const db = createFakeDatabase();
      db.failOn(/-- b/, new Error("syntax error"));

      await expect(runMigrations(db, [migration(1, "a"), migration(2, "b")])).rejects.toThrow(
        MigrationError,
      );

      expect(db.transactions.rolledBack).toBe(1);
      await expect(db.query("PRAGMA user_version")).resolves.toEqual([{ user_version: 1 }]);
    });

    it("names the migration that failed", async () => {
      const db = createFakeDatabase();
      db.failOn(/-- add_notes_index/, new Error("syntax error"));

      await expect(runMigrations(db, [migration(1, "add_notes_index")])).rejects.toThrow(
        /add_notes_index/,
      );
    });

    it("stops rather than carrying on to later migrations", async () => {
      const db = createFakeDatabase();
      db.failOn(/-- a/, new Error("syntax error"));

      await expect(runMigrations(db, [migration(1, "a"), migration(2, "b")])).rejects.toThrow(
        MigrationError,
      );

      expect(db.statements.map((s) => s.sql)).not.toContain("-- b");
    });
  });

  describe("rejects a migration list that cannot be trusted", () => {
    it("refuses duplicate versions", async () => {
      await expect(
        runMigrations(createFakeDatabase(), [migration(1, "a"), migration(1, "b")]),
      ).rejects.toThrow(/duplicate/i);
    });

    it("refuses versions that are out of order in the list", async () => {
      await expect(
        runMigrations(createFakeDatabase(), [migration(2, "b"), migration(1, "a")]),
      ).rejects.toThrow(/order/i);
    });

    it("refuses a gap, because a gap means a migration was deleted", async () => {
      await expect(
        runMigrations(createFakeDatabase(), [migration(1, "a"), migration(3, "c")]),
      ).rejects.toThrow(/consecutive/i);
    });

    it("refuses a list that does not start at 1", async () => {
      await expect(runMigrations(createFakeDatabase(), [migration(0, "a")])).rejects.toThrow(
        /start at 1/i,
      );
    });
  });

  /**
   * A database newer than the app means the user downgraded, or a build ran
   * against data from a later one. Migrations only go forward, so the data is
   * unreadable by this build — and carrying on would mean writing to a schema
   * the code does not understand. Failing loudly beats corrupting it.
   */
  it("refuses to open a database newer than the app", async () => {
    const db = createFakeDatabase({ userVersion: 5 });

    await expect(runMigrations(db, [migration(1, "a")])).rejects.toThrow(/newer/i);
  });

  it("rejects a user_version the database reports in an unexpected shape", async () => {
    const db = createFakeDatabase();
    db.enqueueRows([{ something_else: true }]);

    await expect(runMigrations(db, [migration(1, "a")])).rejects.toThrow(MigrationError);
  });
});
