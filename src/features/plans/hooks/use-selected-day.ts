import { useState } from "react";

import type { ApiPlanDaySummary } from "@/core/api/contracts";
import type { IsoDate } from "@/types/domain";
import {
  describeDayHeader,
  describeDaySteps,
  describeDayTile,
  describeQuickCheckStep,
} from "../logic/day-rail";

/** The day picked in a real API-backed Plan Detail. */
export function useSelectedDay(input: {
  days: readonly ApiPlanDaySummary[];
  currentDayNumber: number | null;
  quickCheckEnabled: boolean;
  today: IsoDate;
}) {
  const { days, currentDayNumber, quickCheckEnabled } = input;
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const selectedNumber = pickedDay ?? currentDayNumber ?? 1;
  const day = days.find((candidate) => candidate.dayNumber === selectedNumber) ?? null;
  const pickDay = (dayNumber: number) => setPickedDay(dayNumber);

  if (!day) return { selectedNumber, pickDay, selected: null };

  const normalized = {
    status: day.progress.status,
    completedSteps: day.progress.completedSteps,
    completedAt: day.progress.completedAt,
    scheduledOn: day.progress.scheduledOn,
    dayNumber: day.dayNumber,
  } as const;
  const locked = normalized.status === "locked";
  const today = describeDayTile(normalized, currentDayNumber, { locked }).today;
  const steps = describeDaySteps(
    normalized,
    {
      readingTitle: day.reading.title,
      scriptureReference: day.scriptureReference.reference,
      reflectionCount: day.reflectionPrompts.length,
    },
    { today, locked },
  );

  return {
    selectedNumber,
    pickDay,
    selected: {
      day,
      header: describeDayHeader(normalized, { minutes: day.estimatedMinutes, steps, locked }),
      steps,
      quickCheck: describeQuickCheckStep(
        normalized,
        quickCheckEnabled ? day.quickCheck : null,
        { locked },
      ),
    },
  };
}
