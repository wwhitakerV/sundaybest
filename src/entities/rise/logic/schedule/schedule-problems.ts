import type { BankQuestion, Schedule } from "./bank";
import { sidesProblems } from "./answer-sides";
import { dayProblems } from "./day-rules";
import { questionProblems } from "./question-rules";

/** What's wrong with the bank as a whole: a question as written, an id twice, a conflict with nothing. */
function bankProblems(bank: readonly BankQuestion[]): string[] {
  const ids = new Set<string>();
  const problems = bank.flatMap(questionProblems);
  for (const question of bank) {
    if (ids.has(question.id)) problems.push(`${question.id} is in the bank twice`);
    ids.add(question.id);
  }
  for (const question of bank) {
    for (const other of question.conflicts ?? []) {
      if (!ids.has(other))
        problems.push(`${question.id} conflicts with ${other}, which isn't in the bank`);
    }
  }
  return problems;
}

/**
 * Every way the schedule breaks a rule, against the bank — none for one fit
 * to ship: each question fit to ask, each day's six keeping the day's rules
 * and their sides unpredictable, and no question twice in a cycle.
 */
export function scheduleProblems(schedule: Schedule, bank: readonly BankQuestion[]): string[] {
  const byId = new Map(bank.map((question) => [question.id, question]));
  const problems = bankProblems(bank);
  const asked = new Map<number, Set<string>>();
  schedule.days.forEach((day, index) => {
    const label = `day ${index + 1}`;
    const inCycle = asked.get(day.cycle) ?? new Set<string>();
    asked.set(day.cycle, inCycle);
    const questions: BankQuestion[] = [];
    for (const { id } of day.questions) {
      const question = byId.get(id);
      if (!question) {
        problems.push(`${label}: ${id} isn't in the bank`);
        continue;
      }
      if (inCycle.has(id)) problems.push(`${label}: ${id} is asked again in cycle ${day.cycle}`);
      inCycle.add(id);
      questions.push(question);
    }
    const sides = day.questions.map((question) => question.correctOnLeft);
    for (const problem of [...dayProblems(questions), ...sidesProblems(sides)]) {
      problems.push(`${label}: ${problem}`);
    }
  });
  return problems;
}
