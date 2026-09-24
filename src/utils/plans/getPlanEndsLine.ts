/** A plan starts on Monday — the day after the Sunday its sermon was preached. */
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The line under the day picker saying when a plan `days` long ends. */
export function getPlanEndsLine(days: number | null): string {
  if (days === null) return "Pick how long your plan runs.";
  const endDay = WEEKDAYS.at(days - 1) ?? "Sunday";
  return days === 6 ? `Ends ${endDay}, right before next Sunday.` : `Ends ${endDay}.`;
}
