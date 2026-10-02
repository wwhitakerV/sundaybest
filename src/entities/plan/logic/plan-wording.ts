/** A plan's day by number: "Day 2". */
export function formatDay(day: number): string {
  return `Day ${day}`;
}

/** Where a plan is: "Day 2 of 6". */
export function formatDayOfTotal(day: number, total: number): string {
  return `${formatDay(day)} of ${total}`;
}

/** How long a plan runs: "1 day", "3 days". */
export function formatPlanLength(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}
