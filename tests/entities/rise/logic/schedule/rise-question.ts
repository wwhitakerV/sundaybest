import type { BankQuestion } from "@/entities/rise/logic/schedule/bank";

/** A bank question for a test: only what the test cares about need be given. */
export function riseQuestion(
  id: string,
  category: string,
  difficulty: BankQuestion["difficulty"],
  extra: Partial<BankQuestion> = {},
): BankQuestion {
  return {
    id,
    category,
    difficulty,
    question: `Question ${id}?`,
    options: [`Yes${id.slice(-3)}`, `No${id.slice(-3)}`],
    correctIndex: 0,
    fact: `A fact about ${id}.`,
    ...extra,
  };
}

/** One valid day: easy, medium, easy, medium, medium, hard — six categories. */
export function validDay(): BankQuestion[] {
  return [
    riseQuestion("rise-101", "animals", "easy"),
    riseQuestion("rise-102", "space", "medium"),
    riseQuestion("rise-103", "geography", "easy"),
    riseQuestion("rise-104", "body", "medium"),
    riseQuestion("rise-105", "history", "medium"),
    riseQuestion("rise-106", "science", "hard"),
  ];
}
