import { useState } from "react";

import {
  getAttemptAnswers,
  getDayScripture,
  getQuizAttempt,
  getQuizForDay,
  getQuizQuestions,
  getQuizScore,
  getQuizStatus,
  getReflectionsForDay,
  useAppSelector,
  type AppState,
} from "@/core/store";
import type { PlanDay } from "@/types/domain";
import {
  describeDayHeader,
  describeDaySteps,
  describeDayTile,
  describeQuickCheckStep,
  type QuickCheckStanding,
} from "../logic/day-rail";

/**
 * The day picked in Plan Detail's row of days — the one the plan's on, until
 * another's tapped — and what it holds: its header, its four study steps,
 * and apart from them its Quick Check, if it has one.
 */
export function useSelectedDay(input: {
  days: readonly { day: PlanDay; minutes: number }[];
  currentDayNumber: number | null;
  quickCheckEnabled: boolean;
}) {
  const { days, currentDayNumber, quickCheckEnabled } = input;
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const selectedNumber = pickedDay ?? currentDayNumber ?? 1;
  const selected = days.find(({ day }) => day.dayNumber === selectedNumber) ?? null;
  const day = selected?.day ?? null;
  const pickDay = (dayNumber: number) => setPickedDay(dayNumber);
  const content = useAppSelector((state) =>
    day
      ? {
          readingTitle: day.reading.title,
          scriptureReference: getDayScripture(state, day.id)?.reference ?? null,
          reflectionCount: getReflectionsForDay(state, day.id).length,
          quiz: getQuickCheckStanding(state, day.id),
        }
      : null,
  );

  if (!day || !content) return { selectedNumber, pickDay, selected: null };
  const today = describeDayTile(day, currentDayNumber).today;
  const steps = describeDaySteps(day, content, { today });

  return {
    selectedNumber,
    pickDay,
    selected: {
      day,
      header: describeDayHeader(day, { minutes: selected?.minutes ?? 0, steps }),
      steps,
      quickCheck: describeQuickCheckStep(day, quickCheckEnabled ? content.quiz : null),
    },
  };
}

/** Where a day's Quick Check stands — none if it hasn't one. */
function getQuickCheckStanding(state: AppState, dayId: string): QuickCheckStanding | null {
  const quiz = getQuizForDay(state, dayId);
  if (!quiz) return null;
  const attempt = getQuizAttempt(state, quiz.id);
  return {
    status: getQuizStatus(state, quiz.id),
    questionCount: getQuizQuestions(state, quiz.id).length,
    answeredCount: attempt ? getAttemptAnswers(state, attempt.id).length : 0,
    correctCount: attempt ? (getQuizScore(state, attempt.id)?.correct ?? 0) : 0,
  };
}
