/** What Plan Detail's More menu offers, by key. */
export type MoreMenuKey = "reminder" | "howMade" | "reset";

/** Settings' pages the menu leads to. */
export const DAILY_REMINDER_HREF = "/(tabs)/settings/daily-reminder";
export const HOW_PLANS_ARE_MADE_HREF = "/(tabs)/settings/how-plans-are-made";

/**
 * Plan Detail's More menu, in order: set the daily reminder, read how plans
 * are made, and — last, behind a
 * confirmation — reset it to not started. Nothing that loses a plan: a reset
 * clears only the reader's progress, never what the plan says.
 */
export function getMoreMenuItems(): { key: MoreMenuKey; label: string }[] {
  return [
    { key: "reminder", label: "Daily reminder" },
    { key: "howMade", label: "How plans are made" },
    { key: "reset", label: "Reset plan" },
  ];
}
