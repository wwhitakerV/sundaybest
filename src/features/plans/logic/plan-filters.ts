import {
  getCompletedPlans,
  getInProgressPlans,
  getLibraryPlans,
  getUserPlans,
  type AppState,
} from "@/core/store";
import type { Plan } from "@/types/domain";

export type PlanFilterOption = { label: string; count: number };

/** How many plans each filter holds — read from the store's selectors. */
export type PlanCounts = { all: number; inProgress: number; done: number; saved: number };

/** The Plans tab's filter row: each filter's label with how many plans it holds. */
export function getPlanFilterOptions(counts: PlanCounts): PlanFilterOption[] {
  return [
    { label: "All", count: counts.all },
    { label: "In progress", count: counts.inProgress },
    { label: "Done", count: counts.done },
    { label: "Saved", count: counts.saved },
  ];
}

/**
 * The plans a filter shows, straight from the store's selectors — never a
 * second list kept alongside: All is every plan the user has, In progress
 * those under way, Done those finished, Saved those kept in the library.
 */
export function getPlansForFilter(state: AppState, filter: string): Plan[] {
  switch (filter) {
    case "In progress":
      return getInProgressPlans(state);
    case "Done":
      return getCompletedPlans(state);
    case "Saved":
      return getLibraryPlans(state);
    default:
      return getUserPlans(state);
  }
}
