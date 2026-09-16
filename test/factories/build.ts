/**
 * Typed test-data builders.
 *
 * No domain data yet — later prompts add factories beside this helper as the
 * models appear. The point is that a test states only what it cares about and
 * the builder fills in the rest, so adding a required field does not break
 * every test that never mentioned it.
 *
 * ```ts
 * const aPlan = defineFactory<Plan>(() => ({ id: "plan_1", days: 6 }));
 * aPlan();                 // fully populated
 * aPlan({ days: 1 });      // only the part under test is stated
 * ```
 */
export function defineFactory<T extends object>(defaults: () => T) {
  return (overrides: Partial<T> = {}): T => ({ ...defaults(), ...overrides });
}

/**
 * Builds a list, giving each item its index so callers can vary fields per item.
 *
 * ```ts
 * buildList(3, (i) => aPlan({ id: `plan_${i}` }));
 * ```
 */
export function buildList<T>(count: number, build: (index: number) => T): T[] {
  return Array.from({ length: count }, (_unused, index) => build(index));
}
