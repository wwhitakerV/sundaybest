import type { Database, SqlParams } from "@/core/storage/database/database";

export interface RecordedStatement {
  sql: string;
  params: SqlParams | undefined;
}

export interface FakeDatabase extends Database {
  /** Every statement that reached the database, in order. */
  readonly statements: RecordedStatement[];
  /** Queues rows for the next `query` call. FIFO. */
  enqueueRows(rows: unknown[]): void;
  /** Makes the next matching statement reject. */
  failOn(match: RegExp, error?: Error): void;
  readonly transactions: { started: number; committed: number; rolledBack: number };
  readonly closed: boolean;
}

/**
 * An in-memory `Database` that records what it was asked to do.
 *
 * It is not a SQL engine — it does not execute anything. That is deliberate: the
 * things worth testing above this port are *which statements run, in what order,
 * and inside what transaction*, and a real engine would let a test pass while the
 * app issued the statements in an order SQLite happened to tolerate.
 *
 * `PRAGMA user_version` answers 0 unless rows are queued, so the migration
 * runner can be exercised from a fresh database without setup.
 */
export function createFakeDatabase(options: { userVersion?: number } = {}): FakeDatabase {
  const statements: RecordedStatement[] = [];
  const queuedRows: unknown[][] = [];
  const failures: { match: RegExp; error: Error }[] = [];
  const transactions = { started: 0, committed: 0, rolledBack: 0 };
  let closed = false;
  let userVersion = options.userVersion ?? 0;

  function record(sql: string, params?: SqlParams): void {
    statements.push({ sql, params });

    const failure = failures.find(({ match }) => match.test(sql));
    if (failure !== undefined) throw failure.error;

    const setVersion = /^\s*PRAGMA\s+user_version\s*=\s*(\d+)/i.exec(sql);
    if (setVersion?.[1] !== undefined) userVersion = Number(setVersion[1]);
  }

  const database: FakeDatabase = {
    execute(sql, params) {
      record(sql, params);
      return Promise.resolve();
    },

    query(sql, params) {
      record(sql, params);

      const queued = queuedRows.shift();
      if (queued !== undefined) return Promise.resolve(queued);

      if (/^\s*PRAGMA\s+user_version\s*$/i.test(sql)) {
        return Promise.resolve([{ user_version: userVersion }]);
      }

      return Promise.resolve([]);
    },

    async transaction(work) {
      transactions.started += 1;
      try {
        const result = await work(database);
        transactions.committed += 1;
        return result;
      } catch (error) {
        transactions.rolledBack += 1;
        throw error;
      }
    },

    close() {
      closed = true;
      return Promise.resolve();
    },

    statements,
    transactions,
    get closed() {
      return closed;
    },
    enqueueRows(rows) {
      queuedRows.push(rows);
    },
    failOn(match, error = new Error("statement failed")) {
      failures.push({ match, error });
    },
  };

  return database;
}
