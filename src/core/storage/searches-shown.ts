import { z } from "zod";

import { getAppDatabase } from "./database/app-database";

/** The lists whose search appears once they're long enough, and then stays. */
export const SEARCH_LISTS = ["plans", "reflections", "weeks", "quick-checks"] as const;
export type SearchList = (typeof SEARCH_LISTS)[number];

const shownRowSchema = z.object({ list: z.enum(SEARCH_LISTS) });

/** Which of this reader's lists have offered search on this phone. A row not understood is left out. */
export async function getShownSearches(userId: string): Promise<SearchList[]> {
  const db = await getAppDatabase();
  const rows = await db.query("SELECT list FROM searches_shown WHERE user_id = ?", [userId]);
  return rows.flatMap((row) => {
    const parsed = shownRowSchema.safeParse(row);
    return parsed.success ? [parsed.data.list] : [];
  });
}

/** Records that this reader's list has offered search — once; it's never taken back. */
export async function markSearchShown(userId: string, list: SearchList): Promise<void> {
  const db = await getAppDatabase();
  await db.execute(
    "INSERT OR IGNORE INTO searches_shown (user_id, list, shown_at) VALUES (?, ?, ?)",
    [userId, list, new Date().toISOString()],
  );
}
