import { useState } from "react";

import {
  getDayScripture,
  getQuickCheckStanding,
  getReflectionsForDay,
  useAppSelector,
} from "@/core/store";
import type { IsoDate, PlanDay } from "@/types/domain";
import {
  describeDayHeader,
  describeDaySteps,
  describeDayTile,
  describeQuickCheckStep,
  isDayLockedForStudy,
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
  today: IsoDate;
}) {
  const { days, currentDayNumber, quickCheckEnabled, today: calendarToday } = input;
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
  const dayRecords = days.map(({ day: candidate }) => candidate);
  const locked = isDayLockedForStudy(day, dayRecords, calendarToday);
  const today = describeDayTile(day, currentDayNumber, { locked }).today;
  const steps = describeDaySteps(day, content, { today, locked });

  return {
    selectedNumber,
    pickDay,
    selected: {
      day,
      header: describeDayHeader(day, { minutes: selected?.minutes ?? 0, steps, locked }),
      steps,
      quickCheck: describeQuickCheckStep(day, quickCheckEnabled ? content.quiz : null, { locked }),
    },
  };
}
