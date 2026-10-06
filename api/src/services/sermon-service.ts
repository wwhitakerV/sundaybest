import { and, desc, eq, gt, ilike, inArray, lt, or } from "drizzle-orm";
import { z } from "zod";

import type { Env } from "../config/env.js";
import type { Database } from "../db/client.js";
import { sermonSearches, sermonSources } from "../db/schema.js";
import { parseYouTubeVideoId, resolveYouTubeSermon } from "../providers/youtube.js";
import { searchYouTubeVideos } from "../providers/youtube-search.js";

const DAY_MS = 24 * 60 * 60 * 1000;
/** A sermon's title, channel and thumbnail rarely change: re-pasting its link within a week costs no Supadata call. */
const METADATA_FRESH_MS = 7 * DAY_MS;
/** A search term asked again within a day is answered from what Supadata returned the first time. */
const SEARCH_FRESH_MS = DAY_MS;

type SermonRow = typeof sermonSources.$inferSelect;

export function createSermonService(db: Database, env: Env) {
  async function upsertResolved(input: {
    externalId: string;
    canonicalUrl: string;
    title: string;
    church: string | null;
    thumbnailUrl: string | null;
    publishedOn?: string | null;
    durationSeconds?: number | null;
  }) {
    const existing = await db
      .select()
      .from(sermonSources)
      .where(and(eq(sermonSources.platform, "youtube"), eq(sermonSources.externalId, input.externalId)))
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
          ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
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
          ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
          metadataFetchedAt: now,
        })
        .returning();
    }
    if (!row) throw new Error("Sermon upsert failed");
    return row;
  }

  /** Supadata's videos for a term, from the last day's search when there was one. */
  async function remoteMatches(query: string, limit: number): Promise<SermonRow[]> {
    const key = `${limit}:${query.toLowerCase().replace(/\s+/g, " ").trim()}`;
    const [cached] = await db.select().from(sermonSearches)
      .where(and(eq(sermonSearches.query, key), gt(sermonSearches.searchedAt, new Date(Date.now() - SEARCH_FRESH_MS))))
      .limit(1);
    const cachedIds = z.array(z.string()).safeParse(cached?.externalIds);
    if (cachedIds.success) {
      if (cachedIds.data.length === 0) return [];
      const rows = await db.select().from(sermonSources)
        .where(and(eq(sermonSources.platform, "youtube"), inArray(sermonSources.externalId, cachedIds.data)));
      const byId = new Map(rows.map((row) => [row.externalId, row]));
      return cachedIds.data.flatMap((id) => byId.get(id) ?? []);
    }
    const rows: SermonRow[] = [];
    for (const result of await searchYouTubeVideos(query, limit, env)) rows.push(await upsertResolved(result));
    const searchedAt = new Date();
    const externalIds = rows.map((row) => row.externalId);
    await db.insert(sermonSearches).values({ query: key, externalIds, searchedAt })
      .onConflictDoUpdate({ target: sermonSearches.query, set: { externalIds, searchedAt } });
    await db.delete(sermonSearches).where(lt(sermonSearches.searchedAt, new Date(searchedAt.getTime() - SEARCH_FRESH_MS)));
    return rows;
  }

  return {
    async resolve(url: string) {
      const externalId = parseYouTubeVideoId(url);
      if (externalId) {
        const [known] = await db.select().from(sermonSources)
          .where(and(eq(sermonSources.platform, "youtube"), eq(sermonSources.externalId, externalId),
            gt(sermonSources.metadataFetchedAt, new Date(Date.now() - METADATA_FRESH_MS))))
          .limit(1);
        if (known) return toSermon(known);
      }
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
        for (const row of await remoteMatches(query, limit)) {
          if (byExternalId.size >= limit) break;
          if (!byExternalId.has(row.externalId)) byExternalId.set(row.externalId, row);
        }
      }

      return [...byExternalId.values()].slice(0, limit).map(toSermon);
    },
  };
}

export function toSermon(row: SermonRow) {
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
