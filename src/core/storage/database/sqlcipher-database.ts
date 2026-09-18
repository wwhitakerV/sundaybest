import * as SQLite from "expo-sqlite";

import type { Database, SqlParams } from "./database";

/**
 * The encrypted database, via `expo-sqlite` built against SQLCipher.
 *
 * SQLCipher is switched on by the `expo-sqlite` config plugin
 * (`useSQLCipher: true` in `app.config.ts`) and is a **native build setting** —
 * it needs a real build, and it does not work in Expo Go.
 *
 * The key comes from `src/core/security/database-key`, which generates it on the
 * device and keeps it in the keychain. This module is handed the key and never
 * learns where it came from.
 */

/**
 * The only key format accepted: 32 bytes as 64 lowercase hex characters.
 *
 * This is a security boundary, not tidiness. SQLCipher has no parameterised form
 * for `PRAGMA key`, so the key is concatenated into a SQL string — a value
 * containing a quote would close the literal and make the remainder executable.
 * `database-key.ts` already produces exactly this format; validating again here
 * is the point of defence in depth.
 */
const KEY_FORMAT = /^[0-9a-f]{64}$/;

export class DatabaseOpenError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "DatabaseOpenError";
    Object.setPrototypeOf(this, DatabaseOpenError.prototype);
  }
}

/**
 * The native handle, as much of it as this adapter uses.
 *
 * Declared structurally rather than imported so the adapter does not depend on
 * `SQLiteDatabase`'s full surface — which is large, and most of which this app
 * has no business reaching.
 */
interface NativeDatabase {
  execAsync(source: string): Promise<void>;
  getAllAsync(source: string, params: unknown[]): Promise<unknown[]>;
  runAsync(source: string, params: unknown[]): Promise<unknown>;
  withTransactionAsync(work: () => Promise<unknown>): Promise<unknown>;
  closeAsync(): Promise<void>;
}

/**
 * Opens the database and proves the key works.
 *
 * SQLCipher accepts `PRAGMA key` without validating it and only fails on the
 * first actual read, so a wrong key would otherwise surface much later as an
 * unexplained "file is not a database" in the middle of a feature. The probe
 * read turns that into a failure at open, where the cause is obvious.
 */
export async function openEncryptedDatabase(databaseName: string, key: string): Promise<Database> {
  if (!KEY_FORMAT.test(key)) {
    // The key itself is never included — this message goes to logs.
    throw new DatabaseOpenError("The database key must be 64 lowercase hex characters (32 bytes).");
  }

  let native: NativeDatabase;
  try {
    native = (await SQLite.openDatabaseAsync(databaseName)) as unknown as NativeDatabase;
  } catch (cause) {
    throw new DatabaseOpenError(`Could not open the database "${databaseName}".`, cause);
  }

  try {
    // First statement, before anything else touches the handle.
    await native.execAsync(`PRAGMA key = '${key}'`);
    // Cheapest read that forces SQLCipher to decrypt the header.
    await native.getAllAsync("SELECT count(*) as count FROM sqlite_master", []);
  } catch (cause) {
    // Close before rethrowing: an open handle to a database we cannot read is a
    // file lock with no owner.
    try {
      await native.closeAsync();
    } catch {
      // Nothing useful to do, and the original failure matters more.
    }

    throw new DatabaseOpenError(
      `The database key did not open "${databaseName}". The file may belong to a different install, or be corrupt.`,
      cause,
    );
  }

  return createAdapter(native);
}

function createAdapter(native: NativeDatabase): Database {
  const adapter: Database = {
    async execute(sql: string, params: SqlParams = []): Promise<void> {
      await native.runAsync(sql, [...params]);
    },

    query(sql: string, params: SqlParams = []): Promise<unknown[]> {
      return native.getAllAsync(sql, [...params]);
    },

    async transaction<T>(work: (tx: Database) => Promise<T>): Promise<T> {
      let result: T;

      // expo-sqlite rolls back when the callback throws, so the failure is left
      // to propagate rather than being caught here.
      await native.withTransactionAsync(async () => {
        result = await work(adapter);
      });

      // Assigned by the callback above, which has completed by this line.
      return result!;
    },

    async close(): Promise<void> {
      await native.closeAsync();
    },
  };

  return adapter;
}
