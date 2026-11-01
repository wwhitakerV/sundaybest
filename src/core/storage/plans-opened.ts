import { z } from "zod";

import { getAppDatabase } from "./database/app-database";

const openedRowSchema = z.object({ plan_id: z.string().min(1), opened_at: z.iso.datetime() });

/** When this reader last opened each plan on this phone, by plan. A row not understood is left out. */
export async function getPlansOpened(userId: string): Promise<Record<string, string>> {
  const db = await getAppDatabase();
  const rows = await db.query("SELECT plan_id, opened_at FROM plans_opened WHERE user_id = ?", [
    userId,
  ]);
  return Object.fromEntries(
    rows.flatMap((row) => {
      const parsed = openedRowSchema.safeParse(row);
      return parsed.success ? [[parsed.data.plan_id, parsed.data.opened_at] as const] : [];
    }),
  );
}

/** Records that this reader opened the plan, at `at` — the latest opening replacing the last. */
export async function markPlanOpened(userId: string, planId: string, at: string): Promise<void> {
  const db = await getAppDatabase();
  await db.execute(
    "INSERT OR REPLACE INTO plans_opened (user_id, plan_id, opened_at) VALUES (?, ?, ?)",
    [userId, planId, at],
  );
}
