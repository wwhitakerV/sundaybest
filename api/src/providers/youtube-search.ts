import type { Env } from "../config/env.js";
import { supadataSearchVideos } from "./supadata.js";

export type YouTubeSearchResult = {
  externalId: string;
  canonicalUrl: string;
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  publishedOn: string | null;
};

/** YouTube discovery is powered by Supadata. */
export async function searchYouTubeVideos(
  query: string,
  limit: number,
  env: Env,
): Promise<YouTubeSearchResult[]> {
  if (!env.SUPADATA_API_KEY) return [];

  const results = await supadataSearchVideos(env, query, limit);
  return results.map((item) => ({
    externalId: item.id,
    canonicalUrl: `https://www.youtube.com/watch?v=${item.id}`,
    title: item.title,
    church: item.channel.name,
    thumbnailUrl: item.thumbnail ?? null,
    durationSeconds: item.duration ?? null,
    publishedOn: normalizeDate(item.uploadDate),
  }));
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  return match?.[0] ?? null;
}
