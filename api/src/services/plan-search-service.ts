import { asc, eq, inArray } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { planDays, scriptureReferences } from "../db/schema.js";
import type { createPlanService } from "./plan-service.js";

type PlanService = ReturnType<typeof createPlanService>;
type Summary = Awaited<ReturnType<PlanService["list"]>>[number];
type DayText = { planId: string; heading: string; reference: string };

/** How well a plan matched, best first. */
const RANK = { titleStart: 0, titleWord: 1, title: 2, church: 3, day: 4 } as const;

/**
 * The reader's own plans that match their words — by title, church, or a
 * day's passage or heading — best first, newest first among equals, each
 * with the text the words were found in.
 */
export function createPlanSearchService(db: Database, planService: PlanService) {
  return {
    async search(userId: string, timezone: string, words: string, limit: number) {
      // Newest first, so a stable sort by rank keeps the newest ahead among equals.
      const plans = (await planService.list(userId, timezone)).filter(isReaders).reverse();
      if (plans.length === 0) return [];

      const days: DayText[] = await db
        .select({
          planId: planDays.planId,
          heading: planDays.readingTitle,
          reference: scriptureReferences.canonicalReference,
        })
        .from(planDays)
        .innerJoin(scriptureReferences, eq(scriptureReferences.id, planDays.scriptureReferenceId))
        .where(
          inArray(
            planDays.planId,
            plans.map((plan) => plan.id),
          ),
        )
        .orderBy(asc(planDays.planId), asc(planDays.dayNumber));

      const needle = normalize(words);
      return plans
        .flatMap((plan) => {
          const hit = matchPlan(
            plan,
            days.filter((day) => day.planId === plan.id),
            needle,
          );
          return hit ? [{ plan, ...hit }] : [];
        })
        .sort((a, b) => a.rank - b.rank)
        .slice(0, limit)
        .map(({ plan, matched }) => ({ plan, matched }));
    },
  };
}

/** The plans in the reader's library: their own, and a sample once they've started it. */
function isReaders(plan: Summary): boolean {
  if (plan.status === "archived") return false;
  return plan.isSample ? plan.status === "active" || plan.status === "completed" : true;
}

/** Lower case, spaces collapsed: the same words however they were typed. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Where a plan matched, and how well — or null when it didn't. */
function matchPlan(
  plan: Summary,
  days: readonly DayText[],
  needle: string,
): { rank: number; matched: string } | null {
  const title = normalize(plan.title);
  if (title.startsWith(needle)) return { rank: RANK.titleStart, matched: plan.title };
  if (` ${title}`.includes(` ${needle}`)) return { rank: RANK.titleWord, matched: plan.title };
  if (title.includes(needle)) return { rank: RANK.title, matched: plan.title };

  const church = plan.sermon.church;
  if (church && normalize(church).includes(needle)) return { rank: RANK.church, matched: church };

  for (const day of days) {
    for (const text of [day.reference, day.heading]) {
      if (normalize(text).includes(needle)) return { rank: RANK.day, matched: text };
    }
  }
  return null;
}
