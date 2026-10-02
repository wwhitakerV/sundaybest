import { z } from "zod";

import type { Database } from "./database";

/**
 * Schema migrations, tracked with SQLite's own `user_version`.
 *
 * `user_version` rather than a table of our own: it is a single integer in the
 * database header, so reading it costs nothing and there is no bootstrap problem
 * of needing a migration to create the migrations table.
 */

export interface Migration {
  /** The `user_version` the database has once this migration has run. Starts at 1. */
  readonly version: number;
  /** Stable identifier, used in errors and logs. Never renamed once shipped. */
  readonly name: string;
  up(db: Database): Promise<void>;
}

/**
 * Every migration, in order.
 *
 * Rules for adding one:
 *
 * - **Append only.** Versions are consecutive from 1 and never reordered,
 *   renumbered, or removed. A shipped migration has already run on real devices,
 *   so editing it changes history that exists on those devices and not in this
 *   file.
 * - **Forward only.** There are no `down` migrations. A rollback on a user's
 *   device is a data-loss event with no operator present to supervise it; if a
 *   migration is wrong, the fix is another migration.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: "real-data-cache-and-outbox",
    async up(db) {
      // Server data is cached as contract-shaped JSON and parsed with Zod on
      // read. This avoids maintaining a second copy of the backend relational
      // model on the phone while still making opened plans available offline.
      await db.execute(`
        CREATE TABLE api_resource_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          resource_type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          server_updated_at TEXT,
          cached_at TEXT NOT NULL
        )
      `);
      await db.execute(
        "CREATE INDEX api_resource_cache_type_idx ON api_resource_cache(resource_type)",
      );

      // Reflection answers are intentionally device-only. They never enter the
      // mutation outbox and therefore can never be uploaded by the sync layer.
      await db.execute(`
        CREATE TABLE reflection_answers (
          reflection_id TEXT PRIMARY KEY NOT NULL,
          answer TEXT NOT NULL,
          answered_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Offline-safe server mutations. Each logical mutation owns a stable
      // idempotency key, so replay after reconnect cannot duplicate a write.
      await db.execute(`
        CREATE TABLE mutation_outbox (
          id TEXT PRIMARY KEY NOT NULL,
          kind TEXT NOT NULL,
          entity_key TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          idempotency_key TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          last_error_code TEXT
        )
      `);
      await db.execute(
        "CREATE INDEX mutation_outbox_created_idx ON mutation_outbox(created_at)",
      );
    },
  },
];

export class MigrationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "MigrationError";
    Object.setPrototypeOf(this, MigrationError.prototype);
  }
}

export interface MigrationOutcome {
  from: number;
  to: number;
  /** Names of the migrations that ran, in order. */
  applied: string[];
}

/** `PRAGMA user_version` comes back as a row, from a file. Parsed, not cast. */
const userVersionRowSchema = z.object({
  user_version: z.number().int().min(0),
});

export async function runMigrations(
  db: Database,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<MigrationOutcome> {
  assertUsableMigrationList(migrations);

  const from = await readUserVersion(db);
  const target = migrations.at(-1)?.version ?? 0;

  // The database was written by a later build. Migrations only go forward, so
  // this build cannot read it — and writing to a schema the code does not
  // understand would corrupt it. Stop.
  if (from > target) {
    throw new MigrationError(
      `The database is at version ${from}, newer than this build, which knows up to ${target}.`,
    );
  }

  const pending = migrations.filter((candidate) => candidate.version > from);
  const applied: string[] = [];

  for (const step of pending) {
    try {
      // The migration and its version bump commit together. Apart, a crash
      // between them leaves a changed schema with an unchanged version, so the
      // next launch reapplies a migration against a schema that already has it.
      await db.transaction(async (tx) => {
        await step.up(tx);
        await tx.execute(`PRAGMA user_version = ${step.version}`);
      });
    } catch (cause) {
      throw new MigrationError(
        `Migration ${step.version} (${step.name}) failed; the database is still at version ${
          from + applied.length
        }.`,
        cause,
      );
    }

    applied.push(step.name);
  }

  return { from, to: target, applied };
}

async function readUserVersion(db: Database): Promise<number> {
  let rows: unknown[];
  try {
    rows = await db.query("PRAGMA user_version");
  } catch (cause) {
    throw new MigrationError("Could not read the database schema version.", cause);
  }

  const parsed = userVersionRowSchema.safeParse(rows[0]);
  if (!parsed.success) {
    throw new MigrationError("The database did not report a usable schema version.");
  }

  return parsed.data.user_version;
}

/**
 * Checks the list before touching the database.
 *
 * Every rule here catches a mistake that is easy to make in a pull request and
 * expensive to discover on a user's device, where the schema is already half
 * migrated.
 */
function assertUsableMigrationList(migrations: readonly Migration[]): void {
  if (migrations.length === 0) return;

  const versions = migrations.map((step) => step.version);

  if (new Set(versions).size !== versions.length) {
    throw new MigrationError("Migrations contain duplicate versions.");
  }

  // Ordering is checked before anything that reads `versions[0]` as the lowest
  // version, because that reading is only true once the list is known sorted.
  for (let index = 1; index < versions.length; index += 1) {
    const previous = versions.at(index - 1) ?? 0;
    const current = versions.at(index) ?? 0;

    if (current < previous) {
      throw new MigrationError(
        `Migrations are out of order: ${current} follows ${previous} in the list.`,
      );
    }

    // A gap means a migration was deleted after being shipped. Some installs
    // have run it and some have not, and nothing left in the repo can tell
    // which — so the version numbers no longer describe the schema.
    if (current !== previous + 1) {
      throw new MigrationError(
        `Migration versions must be consecutive: ${previous} is followed by ${current}.`,
      );
    }
  }

  const first = versions.at(0);
  if (first !== 1) {
    throw new MigrationError(`Migrations must start at 1, but the first is ${String(first)}.`);
  }
}
