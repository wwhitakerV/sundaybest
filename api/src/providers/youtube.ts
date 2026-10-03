import { z } from "zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";

const oEmbedSchema = z.object({
  title: z.string().min(1),
  author_name: z.string().min(1).optional(),
  thumbnail_url: z.url().optional(),
});

export interface ResolvedYouTubeSermon {
  externalId: string;
  canonicalUrl: string;
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
}

export function parseYouTubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") return cleanId(url.pathname.split("/").filter(Boolean)[0]);
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    if (url.pathname === "/watch") return cleanId(url.searchParams.get("v"));
    const parts = url.pathname.split("/").filter(Boolean);
    if (["shorts", "live", "embed"].includes(parts[0] ?? "")) return cleanId(parts[1]);
  }
  return null;
}

export async function resolveYouTubeSermon(rawUrl: string, env: Env): Promise<ResolvedYouTubeSermon> {
  const externalId = parseYouTubeVideoId(rawUrl);
  if (!externalId) throw new AppError("SERMON_UNSUPPORTED", "SundayBest currently supports YouTube sermon URLs only");
  const canonicalUrl = `https://www.youtube.com/watch?v=${externalId}`;
  const endpoint = new URL(env.YOUTUBE_OEMBED_BASE_URL);
  endpoint.searchParams.set("url", canonicalUrl);
  endpoint.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  } catch (cause) {
    throw new AppError("SERMON_UNAVAILABLE", "Could not reach YouTube metadata", { cause });
  }
  if (!response.ok) throw new AppError("SERMON_UNAVAILABLE", "YouTube video is unavailable");
  const parsed = oEmbedSchema.safeParse(await response.json());
  if (!parsed.success) throw new AppError("SERMON_UNAVAILABLE", "YouTube metadata response was invalid");
  return {
    externalId,
    canonicalUrl,
    title: parsed.data.title,
    church: parsed.data.author_name ?? null,
    thumbnailUrl: parsed.data.thumbnail_url ?? null,
  };
}

function cleanId(value: string | null | undefined): string | null {
  if (!value || !/^[A-Za-z0-9_-]{6,32}$/.test(value)) return null;
  return value;
}
