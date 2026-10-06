import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";
import { supadataMetadata } from "./supadata.js";

export interface ResolvedYouTubeSermon {
  externalId: string;
  canonicalUrl: string;
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  publishedOn: string | null;
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

export async function resolveYouTubeSermon(
  rawUrl: string,
  env: Env,
): Promise<ResolvedYouTubeSermon> {
  const externalId = parseYouTubeVideoId(rawUrl);
  if (!externalId) {
    throw new AppError(
      "SERMON_UNSUPPORTED",
      "SundayBest currently supports YouTube sermon URLs only",
    );
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${externalId}`;
  const metadata = await supadataMetadata(env, canonicalUrl);
  if (metadata.id !== externalId) {
    throw new AppError("SERMON_UNAVAILABLE", "Supadata returned metadata for a different video");
  }
  if (!metadata.title) {
    throw new AppError("SERMON_UNAVAILABLE", "This YouTube video does not have a usable title");
  }

  return {
    externalId,
    canonicalUrl,
    title: metadata.title,
    church: metadata.author.displayName ?? metadata.author.username ?? null,
    thumbnailUrl: metadata.media.type === "video" ? metadata.media.thumbnailUrl ?? null : null,
    durationSeconds: metadata.media.type === "video" ? metadata.media.duration ?? null : null,
    publishedOn: normalizeDate(metadata.createdAt),
  };
}

function cleanId(value: string | null | undefined): string | null {
  if (!value || !/^[A-Za-z0-9_-]{6,32}$/.test(value)) return null;
  return value;
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  return match?.[0] ?? null;
}
