import { mulberry32 } from "@/utils/random/mulberry32";

/** A day's six: the right answer on the left this many times, on the right the rest. */
const ON_LEFT = 3;
const QUESTIONS = 6;

/** What makes a day's sides predictable — nothing, when they're fit to play. */
export function sidesProblems(correctOnLeft: readonly boolean[]): string[] {
  const problems: string[] = [];
  const left = correctOnLeft.filter(Boolean).length;
  if (left !== ON_LEFT) problems.push(`the right answer is on the left ${left} times`);
  const runs = correctOnLeft.some(
    (side, index) =>
      index >= 2 && side === correctOnLeft.at(index - 1) && side === correctOnLeft.at(index - 2),
  );
  if (runs) problems.push("the right answer is on one side three times running");
  const alternates = correctOnLeft.every(
    (side, index) => index === 0 || side !== correctOnLeft.at(index - 1),
  );
  if (alternates) problems.push("the right answer alternates sides");
  return problems;
}

/** Every way of placing a day's six right answers that isn't predictable. */
const FAIR_SIDES = Array.from({ length: 2 ** QUESTIONS }, (_, bits) =>
  Array.from({ length: QUESTIONS }, (_, index) => ((bits >> index) & 1) === 1),
).filter((sides) => sidesProblems(sides).length === 0);

/**
 * Which side each of a day's six right answers is shown on (true: the left),
 * from `seed`: three each side, never three running, never strictly
 * alternating — the same for everyone on the day.
 */
export function chooseSides(seed: number): boolean[] {
  const pick = Math.floor(mulberry32(seed)() * FAIR_SIDES.length);
  return [...FAIR_SIDES.at(pick)!];
}
