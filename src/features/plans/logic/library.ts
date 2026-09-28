import type { Plan } from "@/types/domain";
import { formatShortDate } from "@/utils/dates/formatShortDate";

/** A library card's words: where it stands, the detail of it, and the two as one line. */
export type LibraryPlanLook = {
  status: string;
  detail: string;
  /** Where it stands and the detail, as the card's line under its title. */
  summary: string;
};

/**
 * How a plan reads in the library: under way (the day it's on), done (when
 * it finished), or not started (how long it runs).
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
      detail: plan.completedAt ? `Finished ${formatShortDate(plan.completedAt)}` : "Finished",
    };
  }
  if (plan.status === "active") {
    return {
      status: "In progress",
      detail: `Day ${progress.currentDayNumber} of ${plan.lengthDays}`,
    };
  }
  return {
    status: "Not started",
    detail: `${plan.lengthDays} ${plan.lengthDays === 1 ? "day" : "days"}`,
  };
}
