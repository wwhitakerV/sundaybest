import { eq } from "drizzle-orm";

import type { UpdateMeRequest } from "../contracts/user.js";
import type { Database } from "../db/client.js";
import { users } from "../db/schema.js";
import { AppError } from "../http/errors.js";

export function createUserService(db: Database) {
  async function get(userId: string) {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row || row.status !== "active") throw new AppError("NOT_FOUND", "User not found");
    return toApiUser(row);
  }

  return {
    get,
    async update(userId: string, input: UpdateMeRequest) {
      const rows = await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      if (!rows[0]) throw new AppError("NOT_FOUND", "User not found");
      return toApiUser(rows[0]);
    },
    async completeOnboarding(userId: string) {
      const now = new Date();
      const rows = await db
        .update(users)
        .set({ onboardedAt: now, updatedAt: now })
        .where(eq(users.id, userId))
        .returning();
      if (!rows[0]) throw new AppError("NOT_FOUND", "User not found");
      return toApiUser(rows[0]);
    },
    async delete(userId: string) {
      await db.delete(users).where(eq(users.id, userId));
    },
  };
}

function toApiUser(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    displayName: row.displayName,
    onboardedAt: row.onboardedAt?.toISOString() ?? null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } as const;
}
