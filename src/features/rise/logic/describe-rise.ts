import { RISE, formatRiseDay, formatSpare, type RiseQuestion } from "@/entities/rise";
import { scoreOf, spareMs, verdictOf, type RiseRun, type RiseVerdict } from "./rise-run";

/** The bank's categories, as a reader would name them; a new one is named from its key. */
const CATEGORY_NAMES: Record<string, string> = {
  animals: "Animals",
  space_science: "Space",
  geography: "Geography",
  human_body: "The body",
  history_art: "History & art",
  general_science: "Science",
};

/** A category's name: the bank's own, or its key made readable. */
function categoryName(key: string): string {
  const named = Object.entries(CATEGORY_NAMES).find(([category]) => category === key)?.[1];
  if (named) return named;
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A question, once played: what was asked, the right answer, how it went, and what it teaches. */
export type LearnedRow = {
  id: string;
  /** Its place in the day, from 1. */
  number: number;
  /** What it's about: "Geography". */
  category: string;
  question: string;
  answer: string;
  verdict: RiseVerdict;
  /** The time it left to spare, for one that rose ("+2.9s"); none for one that burst. */
  time: string | null;
  fact: string;
};

/**
 * A finished day, in words: the score as its headline, how many rose and
 * burst, what each question taught — and what's shared with its poster,
 * which gives none of the answers away.
 */
export function describeRise(run: RiseRun, questions: readonly RiseQuestion[], day: number) {
  const score = scoreOf(run);
  const total = run.questions.length;
  const spare = spareMs(run);
  const time = formatSpare(spare);
  const seconds = (spare / 1000).toFixed(1);
  const byId = new Map(questions.map((question) => [question.id, question]));
  const rows: LearnedRow[] = run.questions.map((asked, index) => {
    const question = byId.get(asked.id);
    return {
      id: asked.id,
      number: index + 1,
      category: categoryName(question?.category ?? ""),
      question: question?.question ?? "",
      answer: asked.answers[asked.right],
      verdict: verdictOf(asked),
      time: verdictOf(asked) === "right" ? formatSpare(RISE.riseMs - asked.markedAt) : null,
      fact: question?.fact ?? "",
    };
  });
  return {
    score,
    headline: `${score} of ${total}`,
    /** Time to spare, all told: the tiebreaker, more the better ("+13.6s"). */
    time,
    line:
      score === total
        ? `Every one rose, with ${seconds} seconds to spare.`
        : `${score} rose. ${total - score} burst. ${seconds} seconds to spare.`,
    rows,
    /** What's shared beside the poster: the game, the day and the score — never an answer. */
    share: `RISE · ${formatRiseDay(day)} · ${score} of ${total} · ${time} to spare`,
    /** The poster's words: the score and the time to spare (its face has no plus), and the game and day. */
    poster: {
      score: `${score} of ${total}`,
      time: `${seconds}s`,
      label: ["RISE", formatRiseDay(day)],
    },
  };
}
