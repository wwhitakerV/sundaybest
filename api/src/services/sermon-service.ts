import { and, eq } from "drizzle-orm";

import type { Env } from "../config/env.js";
import type { Database } from "../db/client.js";
import { sermonSources } from "../db/schema.js";
import { resolveYouTubeSermon } from "../providers/youtube.js";

export function createSermonService(db: Database, env: Env) {
  return {
    async resolve(url: string) {
      const resolved = await resolveYouTubeSermon(url, env);
      const existing = await db
        .select()
        .from(sermonSources)
        .where(and(eq(sermonSources.platform, "youtube"), eq(sermonSources.externalId, resolved.externalId)))
        .limit(1);
      const now = new Date();
      let row = existing[0];
      if (row) {
        [row] = await db
          .update(sermonSources)
          .set({
            canonicalUrl: resolved.canonicalUrl,
            title: resolved.title,
            churchOrChannel: resolved.church,
            thumbnailUrl: resolved.thumbnailUrl,
            metadataFetchedAt: now,
            updatedAt: now,
          })
          .where(eq(sermonSources.id, row.id))
          .returning();
      } else {
        [row] = await db
          .insert(sermonSources)
          .values({
            platform: "youtube",
            externalId: resolved.externalId,
            canonicalUrl: resolved.canonicalUrl,
            title: resolved.title,
            churchOrChannel: resolved.church,
            thumbnailUrl: resolved.thumbnailUrl,
            metadataFetchedAt: now,
          })
          .returning();
      }
      if (!row) throw new Error("Sermon upsert failed");
      return toSermon(row);
    },
  };
}

export function toSermon(row: typeof sermonSources.$inferSelect) {
  return {
    id: row.id,
    platform: row.platform,
    externalId: row.externalId,
    canonicalUrl: row.canonicalUrl,
    title: row.title,
    church: row.churchOrChannel,
    thumbnailUrl: row.thumbnailUrl,
    thumbnailColors: row.thumbnailColors,
    durationSeconds: row.durationSeconds,
    publishedOn: row.publishedOn,
    transcriptStatus: row.transcriptStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } as const;
}
