/**
 * Which days' verses are liked, in memory, for tests that render the verse of
 * the day — in place of `@/core/storage/liked-verses`, which needs the device
 * database:
 *
 *     jest.mock("@/core/storage/liked-verses", () =>
 *       jest.requireActual("@tests/mocks/liked-verses"),
 *     );
 *
 * Plain functions, not `jest.fn`, so Jest's mock resets between tests leave
 * them working. `forgetLikedVerses()` empties the device; `failLikes()` makes
 * the next save fail.
 */
const liked = new Set<string>();
let failing = false;

/** What's recorded on the device. */
export function likedVerses(): ReadonlySet<string> {
  return liked;
}

/** Empties the device of every like, and lets saves through again. */
export function forgetLikedVerses(): void {
  liked.clear();
  failing = false;
}

/** The next save fails, as a full or locked device's would. */
export function failLikes(): void {
  failing = true;
}

export function getLikedVerses(_userId: string): Promise<string[]> {
  return Promise.resolve([...liked]);
}

export function likeVerse(_userId: string, verse: { date: string }): Promise<void> {
  if (failing) return Promise.reject(new Error("The device couldn't save it"));
  liked.add(verse.date);
  return Promise.resolve();
}

export function unlikeVerse(_userId: string, date: string): Promise<void> {
  if (failing) return Promise.reject(new Error("The device couldn't save it"));
  liked.delete(date);
  return Promise.resolve();
}
