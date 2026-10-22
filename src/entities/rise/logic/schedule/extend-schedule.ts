import type { BankQuestion, Schedule } from "./bank";
import { chooseSides } from "./answer-sides";
import { buildCycle } from "./build-cycle";

/** The seed for a day's sides: its number, spread. */
function sidesSeed(dayNumber: number): number {
  return Math.imul(dayNumber, 0x85ebca6b) >>> 0;
}

/**
 * The schedule with whole cycles added until it has at least `leastDays`.
 * The days it had are kept exactly as they were — once published, a day
 * never changes — and each new cycle chooses the questions asked least.
 */
export function extendSchedule(
  schedule: Schedule,
  bank: readonly BankQuestion[],
  leastDays: number,
): Schedule {
  const days = [...schedule.days];
  const uses = new Map<string, number>();
  const count = (id: string) => uses.set(id, (uses.get(id) ?? 0) + 1);
  for (const day of days) for (const question of day.questions) count(question.id);
  let cycle = days.at(-1)?.cycle ?? 0;
  while (days.length < leastDays) {
    cycle += 1;
    const built = buildCycle(bank, { cycle, uses });
    for (const day of built) {
      const sides = chooseSides(sidesSeed(days.length + 1));
      days.push({
        cycle,
        questions: day.map((question, index) => ({
          id: question.id,
          correctOnLeft: sides.at(index) ?? true,
        })),
      });
    }
    for (const question of built.flat()) count(question.id);
  }
  return { days };
}
