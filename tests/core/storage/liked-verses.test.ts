import { getAppDatabase } from "@/core/storage/database/app-database";
import { getLikedVerses, likeVerse, unlikeVerse } from "@/core/storage/liked-verses";
import { createFakeDatabase, type FakeDatabase } from "@tests/mocks/database";

jest.mock("@/core/storage/database/app-database", () => ({ getAppDatabase: jest.fn() }));

let db: FakeDatabase;

beforeEach(() => {
  db = createFakeDatabase();
  jest.mocked(getAppDatabase).mockResolvedValue(db);
});

describe("getLikedVerses", () => {
  it("reads which days' verses this reader has liked", async () => {
    db.enqueueRows([{ verse_date: "2026-10-19" }, { verse_date: "2026-10-12" }]);

    await expect(getLikedVerses("user-1")).resolves.toEqual(["2026-10-19", "2026-10-12"]);
    expect(db.statements.at(-1)).toEqual({
      sql: "SELECT verse_date FROM liked_verses WHERE user_id = ?",
      params: ["user-1"],
    });
  });

  it("leaves out a row it doesn't recognise", async () => {
    db.enqueueRows([{ verse_date: "2026-10-19" }, { verse_date: "someday" }, { nothing: true }]);

    await expect(getLikedVerses("user-1")).resolves.toEqual(["2026-10-19"]);
  });
});

describe("likeVerse", () => {
  it("records the day's verse as liked, with where it's from", async () => {
    await likeVerse("user-1", { date: "2026-10-19", reference: "Colossians 3:13" });

    const write = db.statements.at(-1);
    expect(write?.sql).toBe(
      "INSERT OR REPLACE INTO liked_verses (user_id, verse_date, reference, liked_at) VALUES (?, ?, ?, ?)",
    );
    expect(write?.params?.slice(0, 3)).toEqual(["user-1", "2026-10-19", "Colossians 3:13"]);
  });
});

describe("unlikeVerse", () => {
  it("takes the like back", async () => {
    await unlikeVerse("user-1", "2026-10-19");

    expect(db.statements.at(-1)).toEqual({
      sql: "DELETE FROM liked_verses WHERE user_id = ? AND verse_date = ?",
      params: ["user-1", "2026-10-19"],
    });
  });
});
