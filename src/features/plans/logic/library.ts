import type { Plan } from "@/types/domain";
import { formatShortDate } from "@/utils/dates/formatShortDate";
import { planOverviewHref, studyHref } from "./routes";

/** A library card's words: where it stands, the detail of it, the two as one line, and its button. */
export type LibraryPlanLook = {
  status: string;
  /** Whether it shows as done — its button carries a check. */
  done: boolean;
  detail: string;
  /** Where it stands and the detail, as the card's line over its title. */
  summary: string;
  action: string;
};

/**
 * How a plan reads in the library: under way (the day it's on, Continue),
 * done (when it finished, Review), or not started (how long, Start).
 */
export function describeLibraryPlan(
  plan: Plan,
  progress: { currentDayNumber: number },
): LibraryPlanLook {
  const look = describeStanding(plan, progress);
  return { ...look, summary: `${look.status} · ${look.detail}` };
}

function describeStanding(
  plan: Plan,
  progress: { currentDayNumber: number },
): Omit<LibraryPlanLook, "summary"> {
  if (plan.status === "completed") {
    return {
      status: "Done",
      done: true,
      detail: plan.completedAt ? `Finished ${formatShortDate(plan.completedAt)}` : "Finished",
      action: "Review",
    };
  }
  if (plan.status === "active") {
    return {
      status: "In progress",
      done: false,
      detail: `Day ${progress.currentDayNumber} of ${plan.lengthDays}`,
      action: "Continue",
    };
  }
  return {
    status: "Not started",
    done: false,
    detail: `${plan.lengthDays} ${plan.lengthDays === 1 ? "day" : "days"}`,
    action: "Start",
  };
}

/**
 * Where a library card's button goes: into the day a plan's on — continuing
 * it, or starting it on day one — or, once it's finished, to the plan to
 * review.
 */
export function getLibraryPlanActionHref(plan: Plan, currentDayNumber: number) {
  return plan.status === "completed"
    ? planOverviewHref(plan.id)
    : studyHref(plan.id, currentDayNumber);
}
