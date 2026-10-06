import type { z } from "zod";

import type {
  ApiPlanGeneration,
  sermonSummarySchema,
  getMeResponseSchema,
  getSettingsResponseSchema,
  listPlansResponseSchema,
  sessionCredentialsSchema,
} from "@/core/api/contracts";
import { defineFactory } from "./build";

/** Where the API is reached in tests: `.env.example`'s development URL, set in the Jest setup. */
export const API_URL = "https://api.sundaybest.com";

const NOW = "2026-10-05T12:00:00.000Z";
const USER_ID = "00000000-0000-4000-8000-000000000001";

export const someCredentials = defineFactory<z.infer<typeof sessionCredentialsSchema>>(() => ({
  accessToken: "test-access-token",
  refreshToken: "test-refresh-token",
  expiresIn: 900,
}));

/** A reader on their first launch: not yet onboarded. */
export const aUser = defineFactory<z.infer<typeof getMeResponseSchema>["user"]>(() => ({
  id: USER_ID,
  displayName: null,
  onboardedAt: null,
  status: "active",
  createdAt: NOW,
  updatedAt: NOW,
}));

export const someSettings = defineFactory<z.infer<typeof getSettingsResponseSchema>["settings"]>(
  () => ({
    userId: USER_ID,
    theme: "system",
    textSize: "default",
    bibleTranslation: "BSB",
    defaultPlanLength: 5,
    quickCheckByDefault: true,
    hapticsEnabled: true,
    readingTextOffset: 0,
    readingPaper: "white",
    createdAt: NOW,
    updatedAt: NOW,
  }),
);

export type PlanSummary = z.infer<typeof listPlansResponseSchema>["plans"][number];

/** A five-day plan with Quick Check, being written. */
export const aGeneration = defineFactory<ApiPlanGeneration>(() => ({
  id: "00000000-0000-4000-8000-0000000000a1",
  planId: "00000000-0000-4000-8000-0000000000b1",
  sermonId: "00000000-0000-4000-8000-0000000000c1",
  planTitle: "Break free",
  requestedLength: 5,
  quickCheckEnabled: true,
  status: "writingDays",
  progress: 48,
  attempt: 1,
  error: null,
  startedAt: NOW,
  finishedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
}));

/** A sermon the API has looked up from its YouTube link. */
export const aSermon = defineFactory<z.infer<typeof sermonSummarySchema>>(() => ({
  id: "00000000-0000-4000-8000-0000000000c1",
  platform: "youtube",
  externalId: "vNoO3YQAPNM",
  canonicalUrl: "https://www.youtube.com/watch?v=vNoO3YQAPNM",
  title: "Break free from the grip of temptation",
  church: "Philip Anthony Mitchell",
  thumbnailUrl: null,
  thumbnailColors: [],
  durationSeconds: 2820,
  publishedOn: null,
  transcriptStatus: "available",
  createdAt: NOW,
  updatedAt: NOW,
}));
