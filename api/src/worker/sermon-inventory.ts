import { and, eq, ne, sql } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { planGenerations, sermonInventories } from "../db/schema.js";
import type { InventoryStore } from "../generation/pipeline.js";
import { GENERATOR_VERSION, PROMPT_VERSION } from "../generation/prompts/version.js";

/**
 * Keeps a sermon's points in `sermon_inventories` for its other lengths,
 * under the current generator and prompt. A reader who already has a plan for
 * the sermon is never given them — asking again is asking for a fresh one.
 * Points found later replace kept ones only when there are more of them, so
 * the kept ones serve as many lengths as they can.
 */
export function sermonInventory(db: Database, generation: { id: string; sermonId: string; userId: string }): InventoryStore {
  const current = and(eq(sermonInventories.sermonId, generation.sermonId),
    eq(sermonInventories.generatorVersion, GENERATOR_VERSION), eq(sermonInventories.promptVersion, PROMPT_VERSION));
  return {
    async load() {
      const [own] = await db.select({ id: planGenerations.id }).from(planGenerations)
        .where(and(eq(planGenerations.userId, generation.userId), eq(planGenerations.sermonId, generation.sermonId), ne(planGenerations.id, generation.id)))
        .limit(1);
      if (own) return null;
      const [row] = await db.select({ inventory: sermonInventories.inventory }).from(sermonInventories).where(current).limit(1);
      return row?.inventory ?? null;
    },
    async save(inventory) {
      const pointCount = inventory.points.length;
      await db.insert(sermonInventories)
        .values({ sermonId: generation.sermonId, generatorVersion: GENERATOR_VERSION, promptVersion: PROMPT_VERSION, pointCount, inventory })
        .onConflictDoUpdate({
          target: [sermonInventories.sermonId, sermonInventories.generatorVersion, sermonInventories.promptVersion],
          set: { pointCount, inventory, createdAt: new Date() },
          setWhere: sql`${sermonInventories.pointCount} < ${pointCount}`,
        });
    },
  };
}
