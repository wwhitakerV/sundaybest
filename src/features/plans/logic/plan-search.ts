import type { ApiPlanSearchResult, ApiPlanSummary } from "@/core/api/contracts";
import { describeApiLibraryPlan } from "./api-plan-wording";

/** How long the words must hold still before they're searched. */
export const PLAN_SEARCH_DEBOUNCE_MS = 250;

/** Where a search stands: nothing typed, out, answered (with rows or none), or failed. */
export type PlanSearchStatus = "idle" | "searching" | "ready" | "empty" | "error";

/** A run of a title, and whether it's the words searched. */
export type MatchPart = { text: string; match: boolean };

/** Lower case, spaces collapsed: the words as the server compares them. */
export function normalizePlanSearch(words: string): string {
  return words.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * The rows of an earlier answer that still match the words typed since — by
 * their title or where they matched — so they stay put while the new search
 * is out, and only the ones that no longer match leave.
 */
export function keepStillMatching(
  results: readonly ApiPlanSearchResult[],
  words: string,
): readonly ApiPlanSearchResult[] {
  const needle = normalizePlanSearch(words);
  return results.filter(
    ({ plan, matched }) =>
      normalizePlanSearch(plan.title).includes(needle) ||
      normalizePlanSearch(matched).includes(needle),
  );
}

/** A title cut into runs, each marked whether it's the words searched — every place they appear, in any case. */
export function splitMatches(title: string, words: string): MatchPart[] {
  const needle = normalizePlanSearch(words);
  const haystack = title.toLowerCase();
  // A letter whose lower case is longer would shift every run after it: leave the title whole.
  if (needle.length === 0 || haystack.length !== title.length) {
    return [{ text: title, match: false }];
  }

  const parts: MatchPart[] = [];
  let from = 0;
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    at = haystack.indexOf(needle, at + needle.length)
  ) {
    if (at > from) parts.push({ text: title.slice(from, at), match: false });
    parts.push({ text: title.slice(at, at + needle.length), match: true });
    from = at + needle.length;
  }
  if (from < title.length) parts.push({ text: title.slice(from), match: false });
  return parts;
}

/**
 * A result's second line: why it matched — its church when the title did, or
 * else where the words were found (the church, a passage, a day's heading),
 * the words marked — then where the plan stands ("Day 2 of 7", "Done",
 * "Not started"), so two plans of one title can be told apart.
 */
export function describeResultDetail(
  plan: ApiPlanSummary,
  matched: string,
  words: string,
): MatchPart[] {
  const look = describeApiLibraryPlan(plan);
  const standing = plan.status === "active" ? look.detail : look.status;
  const titleMatched = normalizePlanSearch(plan.title).includes(normalizePlanSearch(words));
  const source = titleMatched ? plan.sermon.church : matched;
  return source
    ? [...splitMatches(source, words), { text: ` · ${standing}`, match: false }]
    : [{ text: standing, match: false }];
}

/** What the search says when nothing matches the words. */
export function describeNoMatch(words: string): string {
  return `Nothing in your plans matches “${words.trim()}”.`;
}
