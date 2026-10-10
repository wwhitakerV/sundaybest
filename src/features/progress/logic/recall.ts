import type { ApiRecalledQuickCheck } from "@/core/api/contracts";

/** A question the reader missed, with the Quick Check it's from. */
export type MissedQuestion = {
  id: string;
  prompt: string;
  answer: string;
  /** What the reader chose — null if it went unanswered. */
  chosen: string | null;
  /** They chose the right one. */
  correct: boolean;
  /** Its answers are Scripture's own words: both shown in the Scripture face. */
  scripture: boolean;
  /** The verse it's about, or the day's passage. */
  reference: string;
  quizId: string;
  planId: string;
  planTitle: string;
  /** The plan's sermon's artwork, to know it by. */
  thumbnailUrl: string | null;
  dayNumber: number;
};

/** What the page says before any Quick Check is finished. */
export const RECALL_EMPTY = {
  title: "No Quick Checks yet",
  message: "What you remember from each study shows here.",
} as const;

/** How to use the grid, under the key, while there's one to tap. */
export const MOSAIC_HINT = "Tap any question to see it.";

/** What "To revisit" says when nothing was missed. */
export const NOTHING_MISSED = "Everything you've been asked, you remembered.";

/** Oldest first: the server lists them newest first. */
const oldestFirst = (quickChecks: readonly ApiRecalledQuickCheck[]) => [...quickChecks].reverse();

/** The key's two counts: what was correct, and what's still to revisit. */
export function countRecall(quickChecks: readonly ApiRecalledQuickCheck[]): {
  correct: string;
  toRevisit: string;
} {
  const questions = quickChecks.flatMap((quickCheck) => quickCheck.questions);
  const correct = questions.filter((question) => question.correct).length;
  return {
    correct: `${correct} correct`,
    toRevisit: `${questions.length - correct} to revisit`,
  };
}

/** A Quick Check in the list: its day and passage, whether it's worth taking again, and its block. */
export type QuickCheckRow = {
  quizId: string;
  dayNumber: number;
  reference: string;
  /** "All correct", or "2 to revisit". */
  standing: string;
  dots: DayBlock["dots"];
};

/** What a Quick Check leaves to do, at a glance: "All correct", or "2 to revisit". */
export function describeStanding(quickCheck: ApiRecalledQuickCheck): string {
  const missed = quickCheck.questions.filter((question) => !question.correct).length;
  return missed === 0 ? "All correct" : `${missed} to revisit`;
}

/** A Quick Check's questions as its block's places. */
function toDots(quickCheck: ApiRecalledQuickCheck): DayBlock["dots"] {
  return quickCheck.questions.map((question) => ({
    id: question.id,
    correct: question.correct,
    answered: question.chosen !== null,
  }));
}

/** A day's Quick Check as the grid shows it: when it was taken, and its questions in order. */
export type DayBlock = {
  quizId: string;
  /** "Oct 4", on this phone's calendar. */
  date: string;
  /** Each question: correct, missed, or never answered. */
  dots: { id: string; correct: boolean; answered: boolean }[];
};

/** Each Quick Check as a block of its questions, newest first — the grid's, left to right. */
export function buildDayBlocks(quickChecks: readonly ApiRecalledQuickCheck[]): DayBlock[] {
  return quickChecks.map((quickCheck) => ({
    quizId: quickCheck.quizId,
    date: new Date(quickCheck.completedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    dots: toDots(quickCheck),
  }));
}

/**
 * Where the one in view sits among those to revisit, counted as the grid is
 * read — the newest Quick Check first, each in its questions' order: "To
 * revisit · 1 of 12" is the first amber dot on the left.
 */
export function describePlace(
  quickChecks: readonly ApiRecalledQuickCheck[],
  shownId: string | null,
): string {
  const inGridOrder = quickChecks.flatMap((quickCheck) =>
    quickCheck.questions.filter((question) => !question.correct).map((question) => question.id),
  );
  const at = shownId === null ? 0 : Math.max(inGridOrder.indexOf(shownId), 0);
  return `To revisit · ${at + 1} of ${inGridOrder.length}`;
}

/** The questions missed, oldest first, each with its Quick Check. */
export function getMissed(quickChecks: readonly ApiRecalledQuickCheck[]): MissedQuestion[] {
  return getQuestions(quickChecks).filter((question) => !question.correct);
}

/** Every question answered, oldest first, each with its Quick Check — a tapped segment's, right or not. */
export function getQuestions(quickChecks: readonly ApiRecalledQuickCheck[]): MissedQuestion[] {
  return oldestFirst(quickChecks).flatMap((quickCheck) =>
    quickCheck.questions.map((question) => ({
      id: question.id,
      correct: question.correct,
      prompt: question.prompt,
      answer: question.answer,
      chosen: question.chosen,
      scripture: question.scripture,
      reference: question.reference ?? quickCheck.reference,
      quizId: quickCheck.quizId,
      planId: quickCheck.planId,
      planTitle: quickCheck.planTitle,
      thumbnailUrl: quickCheck.thumbnailUrl,
      dayNumber: quickCheck.dayNumber,
    })),
  );
}

/** The miss to open on: the newest Quick Check's first missed question — in the order given, oldest first. */
export function getMostRecentMiss(missed: readonly MissedQuestion[]): string | null {
  const newest = missed.at(-1)?.quizId;
  return missed.find((question) => question.quizId === newest)?.id ?? null;
}

/** Quick Checks under their plans, newest first: each its passage and day, and how many it held. */
export function groupQuickChecks(quickChecks: readonly ApiRecalledQuickCheck[]): {
  planId: string;
  title: string;
  thumbnailUrl: string | null;
  rows: QuickCheckRow[];
}[] {
  const plans = new Map<
    string,
    {
      planId: string;
      title: string;
      thumbnailUrl: string | null;
      rows: QuickCheckRow[];
    }
  >();
  for (const quickCheck of quickChecks) {
    const plan = plans.get(quickCheck.planId) ?? {
      planId: quickCheck.planId,
      title: quickCheck.planTitle,
      thumbnailUrl: quickCheck.thumbnailUrl,
      rows: [],
    };
    plan.rows.push({
      quizId: quickCheck.quizId,
      dayNumber: quickCheck.dayNumber,
      reference: quickCheck.reference,
      standing: describeStanding(quickCheck),
      dots: toDots(quickCheck),
    });
    plans.set(quickCheck.planId, plan);
  }
  return [...plans.values()];
}
