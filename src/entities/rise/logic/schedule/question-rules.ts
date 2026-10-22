import type { BankQuestion } from "./bank";

/** The most letters an answer may have, to fit its balloon on one line. */
const ANSWER_MOST_LETTERS = 11;
/** The most words an answer may have. */
const ANSWER_MOST_WORDS = 3;
/** The longest a question may be: read in a moment, with time left to mark. */
const QUESTION_MOST_CHARACTERS = 64;

/** What's wrong with one question as written — nothing, when it's fit to ask. */
export function questionProblems(question: BankQuestion): string[] {
  const problems: string[] = [];
  const [first, second] = question.options;
  if (first.trim().toLowerCase() === second.trim().toLowerCase()) {
    problems.push(`${question.id}: its two answers are the same`);
  }
  for (const answer of question.options) {
    if (answer.length > ANSWER_MOST_LETTERS) {
      problems.push(`${question.id}: "${answer}" is longer than ${ANSWER_MOST_LETTERS} letters`);
    }
    if (answer.trim().split(/\s+/).length > ANSWER_MOST_WORDS) {
      problems.push(`${question.id}: "${answer}" is more than three words`);
    }
  }
  if (question.question.length > QUESTION_MOST_CHARACTERS) {
    problems.push(`${question.id}: the question is over ${QUESTION_MOST_CHARACTERS} characters`);
  }
  return problems;
}
