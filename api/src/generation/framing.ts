import { namedChapters } from "./scripture.js";

/**
 * What's wrong with a line SundayBest writes around the sermon's words — a
 * transition, a question, a reflection, a commitment — or null. It may name
 * the passages the sermon names (`sermonChapters`, as `namedChapters` gives
 * them), and no others: Scripture comes only from the sermon.
 */
export function framingProblem(text: string, sermonChapters: readonly string[]): string | null {
  const other = namedChapters(text).find((chapter) => !sermonChapters.includes(chapter));
  return other ? `names Scripture the sermon doesn't name (${other})` : null;
}
