import { z } from "zod";

import type { Env } from "../config/env.js";
import { AppError } from "../http/errors.js";
import { postJson } from "./http.js";

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
  if (!env.TRANSCRIPT_PROVIDER_URL) {
    return {
      async fetch() {
        throw new AppError(
          "INTERNAL",
          "No transcript provider is configured. Set TRANSCRIPT_PROVIDER_URL before real plan generation.",
        );
      },
    };
  }

  return {
    async fetch(input) {
      const raw = await postJson({
        url: env.TRANSCRIPT_PROVIDER_URL!,
        token: env.TRANSCRIPT_PROVIDER_TOKEN,
        body: { platform: "youtube", ...input },
      });
      const parsed = transcriptResponseSchema.safeParse(raw);
      if (!parsed.success) throw new AppError("TRANSCRIPT_UNAVAILABLE", "Transcript provider response failed validation");
      return parsed.data;
    },
  };
}
