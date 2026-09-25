import type { Plan } from "@/types/domain";
import { formatShortDate } from "@/utils/dates/formatShortDate";

/** A library card's words: its status pill, the line under the title, and what opening it does. */
export type LibraryPlanLook = {
  status: string;
  /** Whether it shows as done — its pill carries a check. */
  done: boolean;
  detail: string;
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
