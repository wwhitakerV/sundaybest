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
