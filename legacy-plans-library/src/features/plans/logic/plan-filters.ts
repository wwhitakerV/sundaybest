/** Plans' two filters; with neither picked, every plan shows. */
export type PlanFilter = "In progress" | "Done";

/** The filters, each with how many plans it holds. */
export function getPlanFilterOptions(counts: {
  inProgress: number;
  done: number;
}): { label: PlanFilter; count: number }[] {
  return [
    { label: "In progress", count: counts.inProgress },
    { label: "Done", count: counts.done },
  ];
}

/** What the library says when the plans showing are none. */
export function describeEmptyLibrary(filter: PlanFilter | null): {
  title: string;
  message: string;
} {
  switch (filter) {
    case "In progress":
      return { title: "Nothing in progress", message: "Start a plan and it will show here." };
    case "Done":
      return { title: "No finished plans yet", message: "Plans you finish will show here." };
    default:
      return { title: "No plans yet", message: "Add a sermon and your first plan will show here." };
  }
}
