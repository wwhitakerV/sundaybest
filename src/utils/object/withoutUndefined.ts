/**
 * A partial change without its `undefined` fields, so spreading it over a
 * complete value keeps that value's own fields rather than blanking them.
 */
export function withoutUndefined<T extends object>(
  patch: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}
