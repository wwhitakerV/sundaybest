import { mulberry32 } from "@/utils/random/mulberry32";
import type { BankQuestion, Difficulty } from "./bank";
import { DAY_ORDER, MOST_PER_CATEGORY, clash, dayProblems } from "./day-rules";

/** How many searches a cycle tries, each from a fresh shuffle, before it gives up. */
const ATTEMPTS = 24;
/** How many choices one search may weigh. */
const STEPS = 200_000;

type Steps = { left: number };

/** The seed for one attempt at one cycle: the same everywhere, different for every cycle. */
function seedFor(cycle: number, attempt: number): number {
  return (Math.imul(cycle, 2654435761) + Math.imul(attempt + 1, 0x9e3779b9)) >>> 0;
}

/** The bank in the order an attempt tries it: the least asked first, otherwise shuffled. */
function ordered(
  bank: readonly BankQuestion[],
  uses: ReadonlyMap<string, number>,
  seed: number,
): BankQuestion[] {
  const random = mulberry32(seed);
  return bank
    .map((question) => ({ question, key: random() }))
    .sort(
      (a, b) => (uses.get(a.question.id) ?? 0) - (uses.get(b.question.id) ?? 0) || a.key - b.key,
    )
    .map(({ question }) => question);
}

/** How many whole days the bank can fill: as many as its scarcest difficulty allows. */
function daysIn(bank: readonly BankQuestion[]): number {
  const perDifficulty = (["easy", "medium", "hard"] as const).map((difficulty: Difficulty) => {
    const perDay = DAY_ORDER.filter((wanted) => wanted === difficulty).length;
    return Math.floor(
      bank.filter((question) => question.difficulty === difficulty).length / perDay,
    );
  });
  return Math.min(...perDifficulty);
}

/** Whether `question` can go next in a day as it stands. */
function fits(day: readonly BankQuestion[], question: BankQuestion): boolean {
  if (day.includes(question)) return false;
  if (day.at(-1)?.category === question.category) return false;
  const same = day.filter((asked) => asked.category === question.category).length;
  return same < MOST_PER_CATEGORY && !day.some((asked) => clash(asked, question));
}

/** Every valid day the questions not yet `taken` can make, a category not yet in it preferred. */
function* daysFrom(
  pool: readonly BankQuestion[],
  taken: ReadonlySet<string>,
  steps: Steps,
): Generator<BankQuestion[]> {
  const day: BankQuestion[] = [];
  function* fill(slot: number): Generator<BankQuestion[]> {
    const wanted = DAY_ORDER.at(slot);
    if (wanted === undefined) {
      if (dayProblems(day).length === 0) yield [...day];
      return;
    }
    const candidates = pool.filter(
      (question) =>
        !taken.has(question.id) && question.difficulty === wanted && fits(day, question),
    );
    const isNew = (question: BankQuestion) =>
      day.some((asked) => asked.category === question.category) ? 1 : 0;
    for (const question of [...candidates].sort((a, b) => isNew(a) - isNew(b))) {
      steps.left -= 1;
      if (steps.left < 0) return;
      day.push(question);
      yield* fill(slot + 1);
      day.pop();
    }
  }
  yield* fill(0);
}

/** `count` days from the pool, none sharing a question — or null, if this search can't find them. */
function search(
  pool: readonly BankQuestion[],
  count: number,
  days: BankQuestion[][],
  taken: ReadonlySet<string>,
  steps: Steps,
): BankQuestion[][] | null {
  if (days.length === count) return days;
  for (const day of daysFrom(pool, taken, steps)) {
    const next = new Set(taken);
    for (const question of day) next.add(question.id);
    const found = search(pool, count, [...days, day], next, steps);
    if (found) return found;
    if (steps.left < 0) return null;
  }
  return null;
}

/**
 * One cycle of RISE: as many days as the bank can fill, each keeping every
 * rule (`dayProblems`), no question asked twice — the questions asked least
 * so far (`uses`) chosen first, so new ones come in at once. The same for the
 * same cycle, wherever it's built. A rule is never bent to make a day: a bank
 * that can't make one throws.
 */
export function buildCycle(
  bank: readonly BankQuestion[],
  { cycle, uses = new Map() }: { cycle: number; uses?: ReadonlyMap<string, number> },
): BankQuestion[][] {
  for (let count = daysIn(bank); count > 0; count -= 1) {
    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      const pool = ordered(bank, uses, seedFor(cycle, attempt));
      const found = search(pool, count, [], new Set(), { left: STEPS });
      if (found) return found;
    }
  }
  throw new Error("RISE: the bank can't make a single day that keeps every rule");
}
