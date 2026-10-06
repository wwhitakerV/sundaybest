import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { Env } from "../config/env.js";
import * as schema from "./schema.js";

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  db: Database;
  sql: postgres.Sql;
  close(): Promise<void>;
}

export function createDatabase(env: Env): DatabaseConnection {
  const sql = postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "test" ? 2 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true,
    onnotice: () => undefined,
  });

  const db = drizzle(sql, { schema });

  return {
    db,
    sql,
    async close() {
      await sql.end({ timeout: 5 });
    },
  };
}
