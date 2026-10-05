import { z } from "zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";

const youtubeSearchSchema = z.object({
  items: z.array(
    z.object({
      id: z.object({ videoId: z.string().min(1) }),
      snippet: z.object({
        title: z.string().min(1),
        channelTitle: z.string().min(1).optional(),
        publishedAt: z.string().optional(),
        thumbnails: z
          .object({
            high: z.object({ url: z.url() }).optional(),
            medium: z.object({ url: z.url() }).optional(),
            default: z.object({ url: z.url() }).optional(),
          })
          .optional(),
      }),
    }),
  ),
});

export type YouTubeSearchResult = {
  externalId: string;
  canonicalUrl: string;
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  publishedOn: string | null;
};

export async function searchYouTubeVideos(
  query: string,
  limit: number,
  env: Env,
): Promise<YouTubeSearchResult[]> {
  if (!env.SUPADATA_API_KEY) return [];

  const endpoint = new URL(env.YOUTUBE_SEARCH_BASE_URL);
  endpoint.searchParams.set("part", "snippet");
  endpoint.searchParams.set("type", "video");
  endpoint.searchParams.set("maxResults", String(limit));
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("key", env.SUPADATA_API_KEY);
  endpoint.searchParams.set("safeSearch", "moderate");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    throw new AppError("SERMON_UNAVAILABLE", "Could not reach YouTube search", { cause });
  }

  if (!response.ok) {
    throw new AppError("SERMON_UNAVAILABLE", "YouTube search is unavailable");
  }

  const parsed = youtubeSearchSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AppError("SERMON_UNAVAILABLE", "YouTube search response was invalid");
  }

  return parsed.data.items.map(({ id, snippet }) => ({
    externalId: id.videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${id.videoId}`,
    title: decodeHtmlEntities(snippet.title),
    church: snippet.channelTitle ? decodeHtmlEntities(snippet.channelTitle) : null,
    thumbnailUrl:
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      null,
    publishedOn: snippet.publishedAt?.slice(0, 10) ?? null,
  }));
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
