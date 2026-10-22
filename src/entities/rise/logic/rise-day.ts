import bankData from "../data/rise-bank.json";
import scheduleData from "../data/rise-schedule.json";
import { bankSchema, scheduleSchema } from "./schedule/bank";

/** Day 1 of RISE: midnight UTC, Thursday 22 October 2026. */
export const RISE_FIRST_DAY = Date.UTC(2026, 9, 22);
const DAY_MS = 24 * 60 * 60 * 1000;

const bank = new Map(bankSchema.parse(bankData).map((question) => [question.id, question]));
const schedule = scheduleSchema.parse(scheduleData);

/** One of a day's questions as it's played: its answers in the order shown, left first. */
export type RiseQuestion = {
  id: string;
  category: string;
  question: string;
  answers: [string, string];
  /** Which of `answers` is right: 0, the left; 1, the right. */
  right: 0 | 1;
  rightAnswer: string;
  fact: string;
};

/**
 * Which day of RISE it is at `nowMs`: one day for everyone on Earth at once,
 * turning over at midnight UTC — so a day's six can't be passed on to anyone
 * yet to play them, and every result on a day was played on the same six.
 */
export function riseDayNumber(nowMs: number): number {
  return Math.max(1, Math.floor((nowMs - RISE_FIRST_DAY) / DAY_MS) + 1);
}

/**
 * Time to spare — the seconds a right answer left on its pair's clock, or
 * a run's, all told — as it's shown: "+13.6s".
 */
export function formatSpare(ms: number): string {
  return `+${(ms / 1000).toFixed(1)}s`;
}

/** "DAY 001": a day's number as the game labels it. */
export function formatRiseDay(day: number): string {
  return `DAY ${String(day).padStart(3, "0")}`;
}

/**
 * A day's six, in order, each with its answers placed as everyone sees
 * them. Past the schedule's end it starts the schedule again — extend it
 * before then (`npm run build:rise`).
 */
export function riseQuestions(day: number): RiseQuestion[] {
  const scheduled = schedule.days.at((day - 1) % schedule.days.length)!;
  return scheduled.questions.map(({ id, correctOnLeft }) => {
    const question = bank.get(id)!;
    const rightAnswer = question.options[question.correctIndex];
    const wrongAnswer = question.options[question.correctIndex === 0 ? 1 : 0];
    return {
      id,
      category: question.category,
      question: question.question,
      answers: correctOnLeft ? [rightAnswer, wrongAnswer] : [wrongAnswer, rightAnswer],
      right: correctOnLeft ? 0 : 1,
      rightAnswer,
      fact: question.fact,
    };
  });
}
