import type { SearchList } from "@/core/storage/searches-shown";

/**
 * Which lists have offered search, in memory, for tests that render a list
 * with one — in place of `@/core/storage/searches-shown`, which needs the
 * device database:
 *
 *     jest.mock("@/core/storage/searches-shown", () =>
 *       jest.requireActual("@tests/mocks/searches-shown"),
 *     );
 *
 * Plain functions, not `jest.fn`, so Jest's mock resets between tests leave
 * them working. `forgetShownSearches()` empties the device.
 */
const shown = new Set<SearchList>();

export { SEARCH_LISTS } from "@/core/storage/searches-shown";

/** What's recorded on the device. */
export function shownSearches(): ReadonlySet<SearchList> {
  return shown;
}

/** Empties the device of every record. */
export function forgetShownSearches(): void {
  shown.clear();
}

export function getShownSearches(_userId: string): Promise<SearchList[]> {
  return Promise.resolve([...shown]);
}

export function markSearchShown(_userId: string, list: SearchList): Promise<void> {
  shown.add(list);
  return Promise.resolve();
}
