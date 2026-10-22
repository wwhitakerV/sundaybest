import { z } from "zod";

import { getAppDatabase } from "./database/app-database";

/** The one-time moments: played once on a phone, and never again. */
const MOMENTS = ["welcome"] as const;
export type Moment = (typeof MOMENTS)[number];

const seenRowSchema = z.object({ moment: z.enum(MOMENTS) });

/** Which moments this reader has had on this phone. A row not understood is left out. */
export async function getSeenMoments(userId: string): Promise<Moment[]> {
  const db = await getAppDatabase();
  const rows = await db.query("SELECT moment FROM moments_seen WHERE user_id = ?", [userId]);
  return rows.flatMap((row) => {
    const parsed = seenRowSchema.safeParse(row);
    return parsed.success ? [parsed.data.moment] : [];
  });
}

/** Records that this reader has had the moment — once; it's never taken back. */
export async function markMomentSeen(userId: string, moment: Moment): Promise<void> {
  const db = await getAppDatabase();
  await db.execute(
    "INSERT OR IGNORE INTO moments_seen (user_id, moment, seen_at) VALUES (?, ?, ?)",
    [userId, moment, new Date().toISOString()],
  );
}
