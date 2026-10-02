import { formatClockTime } from "@/utils/time/formatClockTime";
import { spellNumber } from "@/utils/numbers/spellNumber";

/** The streak, spelled out the way it's said: "Six day streak". None without one. */
export function describeStreak(days: number): string | null {
  if (days < 1) return null;
  const count = spellNumber(days);
  return `${count.charAt(0).toUpperCase()}${count.slice(1)} day streak`;
}

/** When the next day's study comes: "Tomorrow", at the daily reminder's time when it's on. */
export function describeUpNextTime(reminder: { enabled: boolean; time: string } | null): string {
  return reminder?.enabled ? `Tomorrow at ${formatClockTime(reminder.time)}` : "Tomorrow";
}
