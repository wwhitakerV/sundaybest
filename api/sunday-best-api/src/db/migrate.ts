import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import postgres from "postgres";

import { env } from "../config/env.js";

const sql = postgres(env.DATABASE_URL, { max: 1 });

try {
  await sql.unsafe(`
    create table if not exists sundaybest_schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const dir = join(process.cwd(), "drizzle");
  const files = (await readdir(dir)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();

  for (const filename of files) {
    const [existing] = await sql<{ filename: string }[]>`
      select filename from sundaybest_schema_migrations where filename = ${filename}
    `;
    if (existing) continue;

    const migration = await readFile(join(dir, filename), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`insert into sundaybest_schema_migrations (filename) values (${filename})`;
    });
    process.stdout.write(`Applied ${filename}\n`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
