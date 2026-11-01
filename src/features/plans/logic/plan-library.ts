import type { ApiPlanDetail, ApiPlanSummary } from "@/core/api/contracts";
import { formatShortDate } from "@/utils/dates/formatShortDate";
import { getApiCompletedPlans, getApiUserPlans } from "./api-plan-collections";

/** Plans' two shelves: the plans still to study, and the ones finished. */
export type LibraryShelf = "My studies" | "Done";

/** The library, arranged: the plan to lead with, the rest still to study, and those done. */
export type PlanLibrary = {
  /** The unfinished plan opened most lately, led with on My studies; none when there's none. */
  lead: ApiPlanSummary | null;
  /** Every other unfinished plan, the most lately active first. */
  studies: ApiPlanSummary[];
  /** The finished plans, the most lately finished first. */
  done: ApiPlanSummary[];
};

/**
 * The reader's plans as Plans shelves them. A plan's last activity is the
 * later of when it was last opened on this phone (`opened`) and its own last
 * change — so a plan just made comes first, as does one just studied.
 */
export function arrangeLibrary(
  plans: readonly ApiPlanSummary[],
  opened: Readonly<Record<string, string>>,
): PlanLibrary {
  const activeAt = (plan: ApiPlanSummary) => latest(opened[plan.id], plan.updatedAt);
  const unfinished = getApiUserPlans(plans)
    .filter((plan) => plan.status === "active" || plan.status === "ready")
    .sort((a, b) => activeAt(b).localeCompare(activeAt(a)));
  return {
    lead: unfinished[0] ?? null,
    studies: unfinished.slice(1),
    done: getApiCompletedPlans(plans),
  };
}

/** The shelves to choose between: Done only once a plan's been finished. */
export function libraryShelves(library: PlanLibrary): LibraryShelf[] {
  return library.done.length > 0 ? ["My studies", "Done"] : ["My studies"];
}

/**
 * A plan's folio, the line over its title: its church and its Scripture,
 * each when it's known, and — finished — when it was finished:
 * `GRACE CHURCH · ACTS 1:4–8 · FINISHED OCT 19`. Its length is its days.
 */
export function describeFolio(
  plan: Pick<ApiPlanSummary, "status" | "completedAt" | "sermon">,
  passage: string | null,
): string {
  const finished =
    plan.status === "completed" && plan.completedAt
      ? `Finished ${formatShortDate(plan.completedAt)}`
      : null;
  return [plan.sermon.church, passage, finished]
    .filter((part): part is string => part !== null && part.length > 0)
    .join(" · ")
    .toUpperCase();
}

/** The lead's way on, short, its day already in its days beside it: Start, Continue, or — while it waits — Tomorrow. */
export function describeLeadAction(
  plan: Pick<ApiPlanSummary, "status">,
  waiting: boolean,
): { label: string; onward: boolean } {
  if (waiting) return { label: "Tomorrow", onward: false };
  return { label: plan.status === "ready" ? "Start" : "Continue", onward: true };
}

/** The day a plan's on, for its days' accent: where it stands, Day 1 before it's started, none once it's done. */
export function currentDayOf(plan: Pick<ApiPlanSummary, "status" | "progress">): number | null {
  if (plan.status === "completed") return null;
  return plan.progress.currentDayNumber ?? (plan.status === "ready" ? 1 : null);
}

/**
 * The library's colophon: how many plans, how many days studied in them,
 * and since when — `12 PLANS · 58 DAYS STUDIED · SINCE MARCH 2026`. None
 * before there's a plan.
 */
export function describeColophon(plans: readonly ApiPlanSummary[]): string | null {
  const yours = getApiUserPlans(plans);
  const first = yours.map((plan) => plan.createdAt).sort()[0];
  if (!first) return null;
  const days = yours.reduce((sum, plan) => sum + plan.progress.completedDays, 0);
  const since = new Date(first).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return [
    `${yours.length} ${yours.length === 1 ? "plan" : "plans"}`,
    `${days} ${days === 1 ? "day" : "days"} studied`,
    `since ${since}`,
  ]
    .join(" · ")
    .toUpperCase();
}

/**
 * A plan's line under its title, labelled so it explains itself: what it is
 * (`lead`, run in before it with a colon), whether that's the step waiting
 * now (`now`: the accent, as the day it's on is), and its words.
 */
export type Standfirst = { lead: string; now: boolean; text: string; quoted: boolean };

/**
 * What a plan's own pages add to its feature: its Scripture — the first the
 * sermon names, else its first day's — and, for when no step is waiting, its
 * first takeaway. Never the sermon quoted: its real words are in the video.
 */
export function describeIssue(plan: ApiPlanDetail): {
  passage: string | null;
  standfirst: Standfirst | null;
} {
  const passage =
    plan.about?.scripturesReferenced[0]?.reference ?? plan.days[0]?.scriptureReference.reference;
  const takeaway = plan.about?.keyTakeaways[0];
  return {
    passage: passage ?? null,
    standfirst: takeaway ? { lead: "Takeaway", now: false, text: takeaway, quoted: false } : null,
  };
}

function latest(a: string | undefined, b: string): string {
  return a !== undefined && a > b ? a : b;
}
