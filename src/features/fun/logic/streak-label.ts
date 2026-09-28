/** The streak on Daily Trivia's tile: "12 day streak" — or, with none going, an invitation to start one. */
export function getStreakLabel(days: number): string {
  return days > 0 ? `${days} day streak` : "Start a streak";
}
