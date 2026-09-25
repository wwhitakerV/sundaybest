/**
 * The words around the plan under way on Home: where it stands, the way on,
 * today's study, and — for the plan bar — just the day.
 */
export type ActivePlanWords = { status: string; action: string; today: string; day: string };

/**
 * How Home puts the plan under way in context, the way Apple frames a show:
 * a quiet status line over the title ("IN PROGRESS · DAY 2 OF 6"), the call
 * to action ("Continue Day 2"), and what today holds ("Today: Grace is
 * received · 9 min").
 */
export function describeActivePlan(input: {
  currentDay: number;
  totalDays: number;
  dayTitle: string;
  minutes: number;
}): ActivePlanWords {
  const { currentDay, totalDays, dayTitle, minutes } = input;
  return {
    status: `IN PROGRESS · DAY ${currentDay} OF ${totalDays}`,
    action: `Continue Day ${currentDay}`,
    today: `Today: ${dayTitle} · ${minutes} min`,
    day: `Day ${currentDay}`,
  };
}
