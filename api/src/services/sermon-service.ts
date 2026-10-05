import { and, desc, eq, ilike, or } from "drizzle-orm";

import type { Env } from "../config/env.js";
import type { Database } from "../db/client.js";
import { sermonSources } from "../db/schema.js";
import { resolveYouTubeSermon } from "../providers/youtube.js";
import { searchYouTubeVideos } from "../providers/youtube-search.js";

export function createSermonService(db: Database, env: Env) {
  async function upsertResolved(input: {
    externalId: string;
    canonicalUrl: string;
    title: string;
    church: string | null;
    thumbnailUrl: string | null;
    publishedOn?: string | null;
  }) {
    const existing = await db
      .select()
      .from(sermonSources)
      .where(
        and(eq(sermonSources.platform, "youtube"), eq(sermonSources.externalId, input.externalId)),
      )
      .limit(1);
    const now = new Date();
    let row = existing[0];
    if (row) {
      [row] = await db
        .update(sermonSources)
        .set({
          canonicalUrl: input.canonicalUrl,
          title: input.title,
          churchOrChannel: input.church,
          thumbnailUrl: input.thumbnailUrl,
          ...(input.publishedOn !== undefined ? { publishedOn: input.publishedOn } : {}),
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
          externalId: input.externalId,
          canonicalUrl: input.canonicalUrl,
          title: input.title,
          churchOrChannel: input.church,
          thumbnailUrl: input.thumbnailUrl,
          ...(input.publishedOn !== undefined ? { publishedOn: input.publishedOn } : {}),
          metadataFetchedAt: now,
        })
        .returning();
    }
    if (!row) throw new Error("Sermon upsert failed");
    return row;
  }

  return {
    async resolve(url: string) {
      const resolved = await resolveYouTubeSermon(url, env);
      return toSermon(await upsertResolved(resolved));
    },

    async search(query: string, limit: number) {
      const term = `%${query}%`;
      const catalogRows = await db
        .select()
        .from(sermonSources)
        .where(or(ilike(sermonSources.title, term), ilike(sermonSources.churchOrChannel, term)))
        .orderBy(desc(sermonSources.updatedAt))
        .limit(limit);

      const byExternalId = new Map(catalogRows.map((row) => [row.externalId, row]));

      if (byExternalId.size < limit && env.SUPADATA_API_KEY) {
        const remote = await searchYouTubeVideos(query, limit, env);
        for (const result of remote) {
          if (byExternalId.size >= limit) break;
          if (byExternalId.has(result.externalId)) continue;
          const row = await upsertResolved(result);
          byExternalId.set(row.externalId, row);
        }
      }

      return [...byExternalId.values()].slice(0, limit).map(toSermon);
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
