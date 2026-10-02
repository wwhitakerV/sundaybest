import { formatShortDate } from "@/utils/dates/formatShortDate";
import { formatWeekday } from "@/utils/dates/formatWeekday";

/** What a screen reader says for a day of the week: when it is, and whether it was studied. */
export function describeWeekDay(date: string, today: string, studied: boolean): string {
  const when =
    date === today
      ? `Today, ${formatShortDate(date)}`
      : `${formatWeekday(date)}, ${formatShortDate(date)}`;
  if (studied) return `${when}: studied`;
  if (date === today) return `${when}: not yet`;
  return `${when}: ${date < today ? "not studied" : "ahead"}`;
}
