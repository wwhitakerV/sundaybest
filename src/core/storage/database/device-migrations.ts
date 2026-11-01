import type { Migration } from "./migration-list";

/**
 * The migrations from 5 on, each a small table of what a reader did on this
 * phone and nowhere else — kept apart from the list's first four only for
 * length. The list's rules hold here: append only, forward only.
 */
export const DEVICE_MIGRATIONS: readonly Migration[] = [
  {
    version: 5,
    name: "searches-shown",
    async up(db) {
      // Which of a reader's lists have offered search: once a list is long
      // enough to earn it, its search stays, though the list shrinks again.
      // Device-only, as everything here is.
      await db.execute(`
        CREATE TABLE searches_shown (
          user_id TEXT NOT NULL,
          list TEXT NOT NULL,
          shown_at TEXT NOT NULL,
          PRIMARY KEY (user_id, list)
        )
      `);
    },
  },
  {
    version: 6,
    name: "liked-verses",
    async up(db) {
      // The verses of the day a reader has liked, by the day they were the
      // verse, and where they're from. Device-only, as everything here is.
      await db.execute(`
        CREATE TABLE liked_verses (
          user_id TEXT NOT NULL,
          verse_date TEXT NOT NULL,
          reference TEXT NOT NULL,
          liked_at TEXT NOT NULL,
          PRIMARY KEY (user_id, verse_date)
        )
      `);
    },
  },
  {
    version: 7,
    name: "moments-seen",
    async up(db) {
      // One-time moments a reader has had on this phone (Home's welcome), so
      // they play once and never again. Device-only, as everything here is.
      await db.execute(`
        CREATE TABLE moments_seen (
          user_id TEXT NOT NULL,
          moment TEXT NOT NULL,
          seen_at TEXT NOT NULL,
          PRIMARY KEY (user_id, moment)
        )
      `);
    },
  },
  {
    version: 8,
    name: "game-results",
    async up(db) {
      // Each day's result in a daily game (The 99: how long the flock was kept
      // whole), one per reader per day, so the game is played once a day and
      // compared with yesterday. Device-only, as everything here is.
      await db.execute(`
        CREATE TABLE game_results (
          user_id TEXT NOT NULL,
          game TEXT NOT NULL,
          daily INTEGER NOT NULL,
          survived_ms INTEGER NOT NULL,
          played_at TEXT NOT NULL,
          PRIMARY KEY (user_id, game, daily)
        )
      `);
    },
  },
  {
    version: 9,
    name: "game-results-saved",
    async up(db) {
      // The 99 is now scored by sheep saved, its time second: each day's count,
      // empty for a day played before it was kept.
      await db.execute("ALTER TABLE game_results ADD COLUMN saved INTEGER");
    },
  },
  {
    version: 10,
    name: "game-results-detail",
    async up(db) {
      // RISE keeps each day's run with its score, as JSON its own schema reads back.
      await db.execute("ALTER TABLE game_results ADD COLUMN detail TEXT");
    },
  },
  {
    version: 11,
    name: "plans-opened",
    async up(db) {
      // When a reader last opened each plan on this phone, so Plans leads with
      // the one they were in last. Device-only, as everything here is.
      await db.execute(`
        CREATE TABLE plans_opened (
          user_id TEXT NOT NULL,
          plan_id TEXT NOT NULL,
          opened_at TEXT NOT NULL,
          PRIMARY KEY (user_id, plan_id)
        )
      `);
    },
  },
];
