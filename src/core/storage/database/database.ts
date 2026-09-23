/**
 * The local database, as a port.
 *
 * Narrow on purpose: everything above this line is testable against an
 * in-memory fake (`tests/mocks/database.ts`), and the only code that needs a
 * simulator or a device is the adapter in `sqlcipher-database.ts`.
 *
 * The database is encrypted with SQLCipher. Its key is provisioned by
 * `src/core/security/database-key`, which generates it on the device and keeps
 * it in the keychain — this module never sees where the key came from.
 */

/** Values SQLite can bind. Deliberately not `any`. */
type SqlValue = string | number | null | Uint8Array;

export type SqlParams = readonly SqlValue[];

export interface Database {
  /** A statement with no result rows: INSERT, UPDATE, DDL, PRAGMA. */
  execute(sql: string, params?: SqlParams): Promise<void>;

  /**
   * Rows, **unparsed**.
   *
   * `unknown[]` rather than a generic is the point: a row from a file on disk is
   * untrusted input — the file could have been written by an older version of
   * the app, or edited. Callers parse with Zod, which is the same rule the app
   * applies to network responses and deep links. A `query<T>` signature would
   * be a cast wearing a generic's clothing.
   */
  query(sql: string, params?: SqlParams): Promise<unknown[]>;

  /**
   * Runs `work` inside a transaction, rolling back if it throws.
   *
   * The `Database` handed to `work` is the transaction. Using the outer handle
   * inside the callback is a bug the type system cannot catch, so don't.
   */
  transaction<T>(work: (tx: Database) => Promise<T>): Promise<T>;

  close(): Promise<void>;
}
