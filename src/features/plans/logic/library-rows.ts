import type { ApiPlanSummary } from "@/core/api/contracts";
import { describeEmptyLibrary } from "./plan-filters";
import { libraryShelves, type LibraryShelf, type PlanLibrary } from "./plan-library";

/** One row of Plans' library, as its list draws it. */
export type LibraryRow =
  | { kind: "shelves"; shelves: LibraryShelf[] }
  | { kind: "lead"; plan: ApiPlanSummary }
  | { kind: "head"; count: number }
  | { kind: "plan"; plan: ApiPlanSummary }
  | { kind: "empty"; title: string; message: string }
  | { kind: "colophon"; text: string };

/**
 * The library's rows, top to bottom, on the shelf picked: the shelves to
 * choose between (once there are two); on My studies, the plan to lead
 * with, then, under their head, the rest; on Done, the plans finished; and
 * the colophon at the foot. A shelf with nothing on it says so.
 */
export function libraryRows(
  library: PlanLibrary,
  shelf: LibraryShelf,
  colophon: string | null,
): LibraryRow[] {
  const shelves = libraryShelves(library);
  const top: LibraryRow[] = shelves.length > 1 ? [{ kind: "shelves", shelves }] : [];
  const plans: LibraryRow[] =
    shelf === "Done"
      ? library.done.map((plan) => ({ kind: "plan", plan }))
      : [
          ...(library.lead ? [{ kind: "lead", plan: library.lead } as const] : []),
          ...(library.lead && library.studies.length > 0
            ? [{ kind: "head", count: library.studies.length } as const]
            : []),
          ...library.studies.map((plan) => ({ kind: "plan", plan }) as const),
        ];
  if (plans.length === 0) {
    const empty = describeEmptyLibrary(
      shelf === "Done" ? "Done" : library.done.length > 0 ? "In progress" : null,
    );
    return [...top, { kind: "empty", ...empty }];
  }
  return [...top, ...plans, ...(colophon ? [{ kind: "colophon", text: colophon } as const] : [])];
}

/** A row's key in the list: its plan's id, or what it is. */
export function libraryRowKey(row: LibraryRow): string {
  return row.kind === "lead" || row.kind === "plan" ? `${row.kind}-${row.plan.id}` : row.kind;
}
