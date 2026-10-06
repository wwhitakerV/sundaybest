import { z } from "zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";

const supadataErrorSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
  details: z.string().optional(),
}).passthrough();

const searchVideoSchema = z.object({
  type: z.literal("video"),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  duration: z.number().nonnegative().optional(),
  viewCount: z.number().nonnegative().optional(),
  uploadDate: z.string().optional(),
  channel: z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1),
  }),
});

const searchResponseSchema = z.object({
  query: z.string(),
  results: z.array(z.discriminatedUnion("type", [
    searchVideoSchema,
    z.object({ type: z.literal("channel") }).passthrough(),
    z.object({ type: z.literal("playlist") }).passthrough(),
  ])),
  totalResults: z.number().int().nonnegative().optional(),
  nextPageToken: z.string().optional(),
});

const metadataSchema = z.object({
  platform: z.literal("youtube"),
  type: z.string(),
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().nullable(),
  author: z.object({
    username: z.string().optional(),
    displayName: z.string().optional(),
    avatarUrl: z.string().optional(),
    verified: z.boolean().optional(),
  }).passthrough(),
  media: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("video"),
      url: z.string().optional(),
      duration: z.number().nonnegative().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      thumbnailUrl: z.string().url().optional(),
    }).passthrough(),
    z.object({ type: z.literal("image") }).passthrough(),
    z.object({ type: z.literal("carousel") }).passthrough(),
    z.object({ type: z.literal("post") }).passthrough(),
  ]),
  createdAt: z.string().optional(),
}).passthrough();

const transcriptChunkSchema = z.object({
  text: z.string(),
  offset: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  lang: z.string().optional(),
});

const transcriptSchema = z.object({
  content: z.union([z.string(), z.array(transcriptChunkSchema)]),
  lang: z.string().min(1),
  availableLangs: z.array(z.string()).optional().default([]),
});

const jobIdSchema = z.object({ jobId: z.string().min(1) });
const transcriptJobSchema = z.object({
  status: z.enum(["queued", "active", "completed", "failed"]),
  result: transcriptSchema.nullish(),
  content: transcriptSchema.shape.content.optional(),
  lang: z.string().optional(),
  availableLangs: z.array(z.string()).optional(),
  error: z.object({
    error: z.string().optional(),
    message: z.string().optional(),
    details: z.string().optional(),
  }).nullish(),
}).passthrough();

export type SupadataSearchVideo = z.infer<typeof searchVideoSchema>;
export type SupadataMetadata = z.infer<typeof metadataSchema>;
export type SupadataTranscript = z.infer<typeof transcriptSchema>;

export async function supadataSearchVideos(
  env: Env,
  query: string,
  limit: number,
): Promise<SupadataSearchVideo[]> {
  requireKey(env);
  const url = endpoint(env, "/youtube/search");
  url.searchParams.set("query", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("sortBy", "relevance");
  url.searchParams.set("limit", String(limit));

  const raw = await getJson(env, url, 15_000, "SERMON_UNAVAILABLE");
  const parsed = searchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("INTERNAL", "Supadata search response failed validation", {
      exposeMessage: false,
    });
  }
  return parsed.data.results.filter((item): item is SupadataSearchVideo => item.type === "video");
}

export async function supadataMetadata(env: Env, urlValue: string): Promise<SupadataMetadata> {
  requireKey(env);
  const url = endpoint(env, "/metadata");
  url.searchParams.set("url", urlValue);

  const raw = await getJson(env, url, 15_000, "SERMON_UNAVAILABLE");
  const parsed = metadataSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("INTERNAL", "Supadata metadata response failed validation", {
      exposeMessage: false,
    });
  }
  return parsed.data;
}

export async function supadataTranscript(env: Env, urlValue: string): Promise<SupadataTranscript> {
  requireKey(env);
  const url = endpoint(env, "/transcript");
  url.searchParams.set("url", urlValue);
  url.searchParams.set("lang", "en");
  url.searchParams.set("mode", "auto");

  const raw = await getJson(env, url, 45_000, "TRANSCRIPT_UNAVAILABLE");
  const immediate = transcriptSchema.safeParse(raw);
  if (immediate.success) return immediate.data;

  const queued = jobIdSchema.safeParse(raw);
  if (!queued.success) {
    throw new AppError("INTERNAL", "Supadata transcript response failed validation", {
      exposeMessage: false,
    });
  }

  const deadline = Date.now() + env.SUPADATA_TRANSCRIPT_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(env.SUPADATA_TRANSCRIPT_POLL_MS);
    const resultUrl = endpoint(env, `/transcript/${encodeURIComponent(queued.data.jobId)}`);
    const statusRaw = await getJson(env, resultUrl, 20_000, "TRANSCRIPT_UNAVAILABLE");
    const status = transcriptJobSchema.safeParse(statusRaw);
    if (!status.success) {
      throw new AppError("INTERNAL", "Supadata transcript job response failed validation", {
        exposeMessage: false,
      });
    }
    if (status.data.status === "failed") {
      const providerMessage =
        status.data.error?.message ?? status.data.error?.details ?? "Transcript job failed";
      throw new AppError("TRANSCRIPT_UNAVAILABLE", "No usable transcript is available for this sermon", {
        cause: new Error(providerMessage),
      });
    }
    if (status.data.status !== "completed") continue;

    if (status.data.result) return status.data.result;
    const normalized = transcriptSchema.safeParse({
      content: status.data.content,
      lang: status.data.lang,
      availableLangs: status.data.availableLangs ?? [],
    });
    if (normalized.success) return normalized.data;
    throw new AppError("INTERNAL", "Supadata completed without a usable transcript", {
      exposeMessage: false,
    });
  }

  throw new AppError("INTERNAL", "Supadata transcript generation timed out", {
    exposeMessage: false,
  });
}

async function getJson(
  env: Env,
  url: URL,
  timeoutMs: number,
  failureCode: "SERMON_UNAVAILABLE" | "TRANSCRIPT_UNAVAILABLE",
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "x-api-key": requireKey(env),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    throw new AppError("INTERNAL", "Supadata request failed", {
      cause,
      exposeMessage: false,
    });
  }

  if (!response.ok) {
    let providerMessage = `Supadata returned HTTP ${response.status}`;
    try {
      const parsed = supadataErrorSchema.safeParse(await response.json());
      if (parsed.success) {
        providerMessage = parsed.data.message ?? parsed.data.details ?? providerMessage;
      }
    } catch {
      // The status still identifies the provider failure internally.
    }

    // Authentication, throttling and provider outages are operational failures,
    // not a statement about the user's sermon. Keep provider details server-side
    // and let the API's INTERNAL mapping remain retryable.
    if (response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500) {
      throw new AppError("INTERNAL", `Supadata request failed with HTTP ${response.status}`, {
        cause: new Error(providerMessage),
        exposeMessage: false,
      });
    }

    throw new AppError(
      failureCode,
      failureCode === "TRANSCRIPT_UNAVAILABLE"
        ? "No usable transcript is available for this sermon"
        : "This sermon is unavailable right now",
      { cause: new Error(providerMessage) },
    );
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new AppError(failureCode, "Supadata returned invalid JSON", { cause });
  }
}

function endpoint(env: Env, path: string): URL {
  return new URL(path.replace(/^\//, ""), `${env.SUPADATA_BASE_URL.replace(/\/$/, "")}/`);
}

function requireKey(env: Env): string {
  if (!env.SUPADATA_API_KEY) {
    throw new AppError("INTERNAL", "SUPADATA_API_KEY is not configured");
  }
  return env.SUPADATA_API_KEY;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
