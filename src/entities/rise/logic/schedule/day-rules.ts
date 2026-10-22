import type { BankQuestion, Difficulty } from "./bank";

/** A day's six, in order: a confidence builder, a challenge, momentum, then rising to the hardest. */
export const DAY_ORDER: readonly Difficulty[] = [
  "easy",
  "medium",
  "easy",
  "medium",
  "medium",
  "hard",
];
/** No category asked more than this often in a day. */
export const MOST_PER_CATEGORY = 2;
/** A day covers at least this many categories. */
const LEAST_CATEGORIES = 4;

/** Whether two questions give each other away, whichever names the other. */
export function clash(a: BankQuestion, b: BankQuestion): boolean {
  return (a.conflicts ?? []).includes(b.id) || (b.conflicts ?? []).includes(a.id);
}

/** Every rule a day's six break, in words — none for a day fit to play. */
export function dayProblems(day: readonly BankQuestion[]): string[] {
  const problems: string[] = [];
  if (day.length !== DAY_ORDER.length) {
    problems.push(`${DAY_ORDER.length} questions a day, not ${day.length}`);
  }
  day.forEach((question, index) => {
    const wanted = DAY_ORDER.at(index);
    if (wanted && question.difficulty !== wanted) {
      problems.push(`question ${index + 1} should be ${wanted}, not ${question.difficulty}`);
    }
    const before = day.at(index - 1);
    if (index > 0 && before && before.category === question.category) {
      problems.push(`questions ${index} and ${index + 1} are both ${question.category}`);
    }
    day.slice(index + 1).forEach((later) => {
      if (later.id === question.id) problems.push(`${question.id} is asked twice`);
      else if ((question.conflicts ?? []).includes(later.id)) {
        problems.push(`${question.id} gives away ${later.id}`);
      } else if ((later.conflicts ?? []).includes(question.id)) {
        problems.push(`${later.id} gives away ${question.id}`);
      }
    });
  });
  const counts = new Map<string, number>();
  for (const question of day)
    counts.set(question.category, (counts.get(question.category) ?? 0) + 1);
  for (const [category, count] of counts) {
    if (count > MOST_PER_CATEGORY) problems.push(`${category} is asked ${count} times`);
  }
  if (counts.size < LEAST_CATEGORIES) problems.push(`only ${counts.size} categories`);
  return problems;
}
