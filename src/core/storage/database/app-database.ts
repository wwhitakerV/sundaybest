import { isRunningInExpoGo } from "expo";

import { createExpoDatabaseKeyProvider } from "@/core/security/database-key/expo-database-key";
import { createExpoSecureStorage } from "@/core/security/secure-storage/expo-secure-storage";
import type { Database } from "./database";
import { runMigrations } from "./migrations";
import { openPlainDatabase } from "./plain-database";
import { openEncryptedDatabase } from "./sqlcipher-database";

const DATABASE_NAME = "sundaybest.db";

let databasePromise: Promise<Database> | null = null;

/**
 * Opens SundayBest's device database once for the life of the JS runtime.
 *
 * Expo Go cannot ship SQLCipher, so only Expo Go development falls back to
 * plain SQLite. SundayBest's own native builds always provision a device key
 * and open the encrypted SQLCipher database.
 */
export function getAppDatabase(): Promise<Database> {
  databasePromise ??= openAndMigrate();
  return databasePromise;
}

async function openAndMigrate(): Promise<Database> {
  const db = isRunningInExpoGo()
    ? await openPlainDatabase(DATABASE_NAME)
    : await openProductionDatabase();

  await runMigrations(db);
  return db;
}

async function openProductionDatabase(): Promise<Database> {
  const secureStorage = createExpoSecureStorage();
  const keyProvider = createExpoDatabaseKeyProvider(secureStorage);
  const key = await keyProvider.get();
  return openEncryptedDatabase(DATABASE_NAME, key);
}
