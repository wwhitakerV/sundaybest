import { z } from "zod";

/** Progress, opened on a week — and, picked from the weeks, on one of its plans. */
export function progressWeekHref(week: string, plan?: string) {
  return {
    pathname: "/(tabs)/progress",
    // `at` makes each pick a new one, so picking the same week again still lands on it.
    params: { week, ...(plan && { plan }), at: String(Date.now()) },
  } as const;
}

/** The full-screen weeks, zooming out of the dates; a made-up history in development builds. */
export function weeksHref(preview: string | null) {
  return { pathname: "/weeks", params: preview ? { preview } : {} } as const;
}

const progressParamsSchema = z.object({
  week: z.iso.date(),
  plan: z.string().min(1).optional(),
  at: z.string().min(1),
});

/** The week Progress was sent to — untrusted, so parsed — or null when it was opened plainly. */
export function parseProgressParams(
  params: unknown,
): { week: string; plan: string | null; at: string } | null {
  const parsed = progressParamsSchema.safeParse(params);
  return parsed.success
    ? { week: parsed.data.week, plan: parsed.data.plan ?? null, at: parsed.data.at }
    : null;
}

const weeksParamsSchema = z.object({ preview: z.string().min(1).optional() });

/** The made-up history the weeks were opened with, if any — parsed, as every route's params are. */
export function parseWeeksParams(params: unknown): string | null {
  const parsed = weeksParamsSchema.safeParse(params);
  return parsed.success ? (parsed.data.preview ?? null) : null;
}

/** Your words, opened on one reflection — picked from the list of them all. */
export function wordsHref(reflectionId: string) {
  return {
    pathname: "/(tabs)/progress/words",
    // `at` makes each pick a new one, so picking the one showing again still lands on it.
    params: { show: reflectionId, at: String(Date.now()) },
  } as const;
}

const wordsParamsSchema = z.object({ show: z.string().min(1), at: z.string().min(1) });

/** The reflection Your words was sent to — untrusted, so parsed — or null when opened plainly. */
export function parseWordsParams(params: unknown): { show: string; at: string } | null {
  const parsed = wordsParamsSchema.safeParse(params);
  return parsed.success ? parsed.data : null;
}
