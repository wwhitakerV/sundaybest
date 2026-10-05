import { z } from "zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";
import { postJson } from "./http.js";
import { supadataTranscript } from "./supadata.js";

const transcriptResponseSchema = z.object({
  language: z.string().min(2).max(20),
  kind: z.enum(["captions", "autoCaptions"]),
  segments: z
    .array(
      z.object({
        startMs: z.number().int().nonnegative(),
        endMs: z.number().int().nonnegative().nullable(),
        text: z.string().min(1),
      }),
    )
    .min(1),
});

export type TranscriptResult = z.infer<typeof transcriptResponseSchema>;

export interface TranscriptProvider {
  fetch(input: {
    externalId: string;
    canonicalUrl: string;
    title: string;
    church: string | null;
  }): Promise<TranscriptResult>;
}

export function createTranscriptProvider(env: Env): TranscriptProvider {
  // A custom provider remains available for deployments that explicitly set it.
  if (env.TRANSCRIPT_PROVIDER_URL) {
    return {
      async fetch(input) {
        const raw = await postJson({
          url: env.TRANSCRIPT_PROVIDER_URL!,
          token: env.TRANSCRIPT_PROVIDER_TOKEN,
          body: { platform: "youtube", ...input },
        });
        const parsed = transcriptResponseSchema.safeParse(raw);
        if (!parsed.success) {
          throw new AppError(
            "TRANSCRIPT_UNAVAILABLE",
            "Transcript provider response failed validation",
          );
        }
        return parsed.data;
      },
    };
  }

  return {
    async fetch(input) {
      if (!env.SUPADATA_API_KEY) {
        throw new AppError(
          "INTERNAL",
          "No transcript provider is configured. Set SUPADATA_API_KEY.",
        );
      }

      const transcript = await supadataTranscript(env, input.canonicalUrl);
      if (typeof transcript.content === "string") {
        const text = transcript.content.trim();
        if (!text) throw new AppError("TRANSCRIPT_UNAVAILABLE", "Supadata returned an empty transcript");
        return {
          language: transcript.lang,
          kind: "captions",
          segments: [{ startMs: 0, endMs: null, text }],
        };
      }

      const segments = transcript.content
        .map((segment) => ({
          startMs: Math.max(0, Math.round(segment.offset)),
          endMs: Math.max(0, Math.round(segment.offset + segment.duration)),
          text: segment.text.trim(),
        }))
        .filter((segment) => segment.text.length > 0);

      if (segments.length === 0) {
        throw new AppError("TRANSCRIPT_UNAVAILABLE", "Supadata returned an empty transcript");
      }

      return {
        language: transcript.lang,
        kind: "captions",
        segments,
      };
    },
  };
}
