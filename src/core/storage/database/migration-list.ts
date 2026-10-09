import type { Database } from "./database";

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
      await db.execute("CREATE INDEX mutation_outbox_created_idx ON mutation_outbox(created_at)");
    },
  },
  {
    version: 2,
    name: "scope-private-reflections-to-user",
    async up(db) {
      // v1 introduced reflection storage before it was connected to the UI.
      // Rebuild it now with user ownership before private writing ships. A
      // shared/sample reflection prompt has the same content id for everyone,
      // so reflection_id alone cannot be the privacy boundary on a device that
      // may eventually switch or link accounts.
      await db.execute("ALTER TABLE reflection_answers RENAME TO reflection_answers_v1");
      await db.execute(`
        CREATE TABLE reflection_answers (
          user_id TEXT NOT NULL,
          reflection_id TEXT NOT NULL,
          answer TEXT NOT NULL,
          answered_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (user_id, reflection_id)
        )
      `);
      // Phase 3 is the first release that writes reflection answers, so there
      // is no user-authored v1 data to migrate safely without an owner id.
      await db.execute("DROP TABLE reflection_answers_v1");
      await db.execute("CREATE INDEX reflection_answers_user_idx ON reflection_answers(user_id)");
    },
  },
  {
    version: 3,
    name: "scope-offline-server-state-to-user",
    async up(db) {
      // v1 created these tables before the real sync layer shipped. Rebuild
      // them with an explicit user scope so a future account switch on the
      // same device can never surface another user's cached server data or
      // replay another user's queued mutations. No production release wrote
      // these tables before this migration, so old rows are intentionally
      // discarded rather than assigned an unverifiable owner.
      await db.execute("DROP TABLE IF EXISTS api_resource_cache");
      await db.execute(`
        CREATE TABLE api_resource_cache (
          scope_id TEXT NOT NULL,
          cache_key TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          server_updated_at TEXT,
          cached_at TEXT NOT NULL,
          PRIMARY KEY (scope_id, cache_key)
        )
      `);
      await db.execute(
        "CREATE INDEX api_resource_cache_scope_type_idx ON api_resource_cache(scope_id, resource_type)",
      );

      await db.execute("DROP TABLE IF EXISTS mutation_outbox");
      await db.execute(`
        CREATE TABLE mutation_outbox (
          id TEXT PRIMARY KEY NOT NULL,
          scope_id TEXT NOT NULL,
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
        "CREATE INDEX mutation_outbox_scope_created_idx ON mutation_outbox(scope_id, created_at)",
      );
    },
  },
  {
    version: 4,
    name: "reflection-lines",
    async up(db) {
      // Lines a reader adds later to what they wrote — one a day for each
      // reflection, the original never edited. Device-only, as the answers
      // are: never in the outbox, never uploaded.
      await db.execute(`
        CREATE TABLE reflection_lines (
          user_id TEXT NOT NULL,
          reflection_id TEXT NOT NULL,
          written_on TEXT NOT NULL,
          text TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (user_id, reflection_id, written_on)
        )
      `);
      await db.execute("CREATE INDEX reflection_lines_user_idx ON reflection_lines(user_id)");
    },
  },
];
