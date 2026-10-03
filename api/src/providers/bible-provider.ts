import { z } from "zod";

import type { Env } from "../config/env.js";
import type { ApiUserSettings } from "../contracts/settings.js";
import { AppError } from "../http/errors.js";
import { postJson } from "./http.js";

const bibleGatewayResponseSchema = z.object({
  reference: z.string().min(1).max(100),
  translation: z.enum(["NIV", "ESV", "KJV", "NLT", "BSB"]),
  provider: z.string().min(1).max(100),
  providerVersion: z.string().max(100).nullable().optional(),
  cacheAllowed: z.boolean(),
  verses: z.array(z.object({ number: z.number().int().positive(), text: z.string().min(1) })).min(1),
});

export type BiblePassage = z.infer<typeof bibleGatewayResponseSchema>;

export interface BibleProvider {
  getPassage(input: { reference: string; translation: ApiUserSettings["bibleTranslation"] }): Promise<BiblePassage>;
}

export function createBibleProvider(env: Env): BibleProvider {
  if (!env.BIBLE_PROVIDER_URL) {
    return {
      async getPassage(input) {
        if (env.NODE_ENV !== "production" && input.translation === "KJV" && input.reference === "Psalm 119:105") {
          return {
            reference: input.reference,
            translation: "KJV",
            provider: "development-public-domain",
            providerVersion: null,
            cacheAllowed: true,
            verses: [{ number: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." }],
          };
        }
        throw new AppError(
          "INTERNAL",
          "No Bible provider is configured for this translation. Set BIBLE_PROVIDER_URL before real study use.",
        );
      },
    };
  }

  return {
    async getPassage(input) {
      const raw = await postJson({
        url: env.BIBLE_PROVIDER_URL!,
        token: env.BIBLE_PROVIDER_TOKEN,
        body: input,
      });
      const parsed = bibleGatewayResponseSchema.safeParse(raw);
      if (!parsed.success || parsed.data.translation !== input.translation) {
        throw new AppError("INTERNAL", "Bible provider response failed validation");
      }
      if (normalizeReference(parsed.data.reference) !== normalizeReference(input.reference)) {
        throw new AppError("INTERNAL", "Bible provider returned a different Scripture reference");
      }
      return parsed.data;
    },
  };
}

function normalizeReference(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
