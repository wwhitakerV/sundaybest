import { z } from "zod";

import { apiIdSchema, isoDateSchema, isoDateTimeSchema } from "./common";

export const sermonSummarySchema = z.object({
  id: apiIdSchema,
  platform: z.literal("youtube"),
  externalId: z.string().min(1).max(128),
  canonicalUrl: z.url(),
  /** The sermon's own title once found, else its video's title as it is. */
  title: z.string().min(1).max(300),
  /** The series the sermon is from, and which part, in the video title's own words; none for sermons saved before. */
  series: z.string().min(1).max(200).nullable().default(null),
  part: z.string().min(1).max(60).nullable().default(null),
  church: z.string().max(200).nullable(),
  thumbnailUrl: z.url().nullable(),
  thumbnailColors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).max(6),
  durationSeconds: z.number().int().nonnegative().nullable(),
  publishedOn: isoDateSchema.nullable(),
  transcriptStatus: z.enum(["available", "autoCaptions", "processing", "unavailable"]),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const resolveSermonRequestSchema = z
  .object({
    url: z.url(),
  })
  .strict();

export const resolveSermonResponseSchema = z.object({ sermon: sermonSummarySchema });

export const searchSermonsResponseSchema = z.object({
  sermons: z.array(sermonSummarySchema),
});

export type ApiSermonSummary = z.infer<typeof sermonSummarySchema>;
export type ResolveSermonRequest = z.infer<typeof resolveSermonRequestSchema>;
