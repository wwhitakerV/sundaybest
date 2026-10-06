import { z } from "zod";

import { BibleLookupError, createBibleStore } from "../bible/bible-store.js";
import { BIBLE_TRANSLATIONS, type BibleTranslation as BundledTranslation } from "../bible/types.js";
import type { Env } from "../config/env.js";
import type { ApiUserSettings } from "../contracts/settings.js";
import { AppError } from "../http/errors.js";
import { postJson } from "./http.js";

type Translation = ApiUserSettings["bibleTranslation"];

/** Copyrighted translations: only ever served by a licensed gateway. */
const LICENSED_TRANSLATIONS = ["NIV", "ESV", "NLT"] as const satisfies readonly Translation[];

const bibleGatewayResponseSchema = z.object({
  reference: z.string().min(1).max(100),
  translation: z.enum(["NIV", "ESV", "KJV", "NLT", "BSB"]),
  provider: z.string().min(1).max(100),
  providerVersion: z.string().max(100).nullable().optional(),
  cacheAllowed: z.boolean(),
  verses: z.array(z.object({ number: z.number().int().positive(), text: z.string().trim().min(1) })).min(1),
});

export type BiblePassage = z.infer<typeof bibleGatewayResponseSchema>;

export interface BibleProvider {
  /** Translations served from bundled public-domain text: no network, no database. */
  readonly bundledTranslations: readonly BundledTranslation[];
  servesLocally(translation: Translation): boolean;
  getPassage(input: { reference: string; translation: Translation }): Promise<BiblePassage>;
}

/** What a user may choose: the bundled translations, plus licensed ones when a gateway is configured. */
export function availableTranslations(env: Env): Translation[] {
  return [...BIBLE_TRANSLATIONS, ...(env.BIBLE_PROVIDER_URL ? LICENSED_TRANSLATIONS : [])];
}

function isBundled(translation: Translation): translation is BundledTranslation {
  return BIBLE_TRANSLATIONS.some((bundled) => bundled === translation);
}

export function createBibleProvider(env: Env): BibleProvider {
  const store = createBibleStore();

  function bundledPassage(reference: string, translation: BundledTranslation): BiblePassage {
    let passage;
    try {
      passage = store.getPassage({ ...store.parseReference(reference, translation), translation });
    } catch (cause) {
      if (!(cause instanceof BibleLookupError)) throw cause;
      throw new AppError("INTERNAL", `${reference} is not a valid ${translation} reference`, { cause, permanent: true });
    }
    if (passage.verses.length === 0) {
      throw new AppError("INTERNAL", `${reference} is not in the ${translation} text`, { permanent: true });
    }
    return {
      reference,
      translation,
      provider: passage.provider,
      providerVersion: passage.providerVersion,
      cacheAllowed: true,
      // The KJV file brackets the words its translators supplied (printed in
      // italics); readers expect the words without the marks.
      verses: passage.verses.map((verse) => ({
        number: verse.number,
        text: translation === "KJV" ? verse.text.replace(/[[\]]/g, "") : verse.text,
      })),
    };
  }

  async function gatewayPassage(reference: string, translation: Translation): Promise<BiblePassage> {
    if (!env.BIBLE_PROVIDER_URL) {
      throw new AppError("INTERNAL", `${translation} is not available without a licensed Bible provider`, { permanent: true });
    }
    const raw = await postJson({ url: env.BIBLE_PROVIDER_URL, token: env.BIBLE_PROVIDER_TOKEN, body: { reference, translation } });
    const parsed = bibleGatewayResponseSchema.safeParse(raw);
    if (!parsed.success || parsed.data.translation !== translation) {
      throw new AppError("INTERNAL", "Bible provider response failed validation");
    }
    if (normalizeReference(parsed.data.reference) !== normalizeReference(reference)) {
      throw new AppError("INTERNAL", "Bible provider returned a different Scripture reference");
    }
    const numbers = parsed.data.verses.map((verse) => verse.number);
    if (new Set(numbers).size !== numbers.length || numbers.some((number, index) => index > 0 && number !== numbers[index - 1]! + 1)) {
      throw new AppError("INTERNAL", "Bible provider returned duplicate or unordered verses");
    }
    return { ...parsed.data, verses: parsed.data.verses.map((verse) => ({ ...verse, text: verse.text.trim() })) };
  }

  return {
    bundledTranslations: BIBLE_TRANSLATIONS,
    servesLocally: isBundled,
    async getPassage({ reference, translation }) {
      return isBundled(translation) ? bundledPassage(reference, translation) : gatewayPassage(reference, translation);
    },
  };
}

function normalizeReference(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
