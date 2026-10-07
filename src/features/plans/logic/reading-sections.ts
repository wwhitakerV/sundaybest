import type { ApiReadingParagraph } from "@/core/api/contracts";

/** A reference reduced for comparing: no spaces, any dash a hyphen, lower case. */
function normalizeReference(reference: string): string {
  return reference
    .toLowerCase()
    .replace(/[‒-―−]/g, "-")
    .replace(/\s+/g, "");
}

/**
 * A day's Read paragraphs split in two: the reading, then its Scripture
 * study — which starts at the paragraph headed by the day's passage (the
 * generator heads it so). Without one, as on a plan written before
 * headings, it's all reading.
 */
export function splitReadingSections(
  paragraphs: readonly ApiReadingParagraph[],
  passageReference: string,
): { read: ApiReadingParagraph[]; study: ApiReadingParagraph[] } {
  const passage = normalizeReference(passageReference);
  const at = paragraphs.findIndex(
    ({ heading }) => heading !== null && normalizeReference(heading) === passage,
  );
  return at === -1
    ? { read: [...paragraphs], study: [] }
    : { read: paragraphs.slice(0, at), study: paragraphs.slice(at) };
}
