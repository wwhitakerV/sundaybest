import * as SQLite from "expo-sqlite";

import type { Database, SqlParams } from "./database";

/**
 * Development-only SQLite adapter for Expo Go.
 *
 * SQLCipher is a native build option and Expo Go cannot enable it. Expo Go is
 * therefore allowed to use a plain local database so device-only features can
 * be exercised during development. A real SundayBest development/release build
 * uses `sqlcipher-database.ts` instead.
 */
export async function openPlainDatabase(databaseName: string): Promise<Database> {
  const native = await SQLite.openDatabaseAsync(databaseName);

  const adapter: Database = {
    async execute(sql: string, params: SqlParams = []): Promise<void> {
      await native.runAsync(sql, [...params]);
    },

    query(sql: string, params: SqlParams = []): Promise<unknown[]> {
      return native.getAllAsync(sql, [...params]);
    },

    async transaction<T>(work: (tx: Database) => Promise<T>): Promise<T> {
      let result: T;
      await native.withTransactionAsync(async () => {
        result = await work(adapter);
      });
      return result!;
    },

    async close(): Promise<void> {
      await native.closeAsync();
    },
  };

  return adapter;
}
