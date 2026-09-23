import type { Plan } from "../types";

export type PlanFilterOption = { label: string; count: number };

/** The Plans tab's filter row: each filter's label with how many plans it holds. */
export function getPlanFilterOptions(plans: readonly Plan[]): PlanFilterOption[] {
  return [
    { label: "All", count: plans.length },
    { label: "In progress", count: plans.filter((plan) => !plan.completed).length },
    { label: "Done", count: plans.filter((plan) => plan.completed).length },
    { label: "Saved", count: 0 },
  ];
}
