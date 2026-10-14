import { getAppDatabase } from "@/core/storage/database/app-database";
import { getShownSearches, markSearchShown } from "@/core/storage/searches-shown";
import { createFakeDatabase, type FakeDatabase } from "@tests/mocks/database";

jest.mock("@/core/storage/database/app-database", () => ({ getAppDatabase: jest.fn() }));

let db: FakeDatabase;

beforeEach(() => {
  db = createFakeDatabase();
  jest.mocked(getAppDatabase).mockResolvedValue(db);
});

describe("getShownSearches", () => {
  it("reads which of this reader's lists have offered search", async () => {
    db.enqueueRows([{ list: "plans" }, { list: "weeks" }]);

    await expect(getShownSearches("user-1")).resolves.toEqual(["plans", "weeks"]);
    expect(db.statements.at(-1)).toEqual({
      sql: "SELECT list FROM searches_shown WHERE user_id = ?",
      params: ["user-1"],
    });
  });

  it("leaves out a row it doesn't recognise", async () => {
    db.enqueueRows([{ list: "plans" }, { list: "somewhere-else" }, { nothing: true }]);

    await expect(getShownSearches("user-1")).resolves.toEqual(["plans"]);
  });
});

describe("markSearchShown", () => {
  it("records, once, that this reader's list has offered search", async () => {
    await markSearchShown("user-1", "reflections");

    const write = db.statements.at(-1);
    expect(write?.sql).toBe(
      "INSERT OR IGNORE INTO searches_shown (user_id, list, shown_at) VALUES (?, ?, ?)",
    );
    expect(write?.params?.slice(0, 2)).toEqual(["user-1", "reflections"]);
  });
});
