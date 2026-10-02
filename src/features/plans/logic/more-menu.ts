/** What Plan Detail's More menu offers, by key. */
export type MoreMenuKey = "save" | "reminder" | "howMade";

/** Settings' pages the menu leads to. */
export const DAILY_REMINDER_HREF = "/(tabs)/settings/daily-reminder";
export const HOW_PLANS_ARE_MADE_HREF = "/(tabs)/settings/how-plans-are-made";

/**
 * Plan Detail's More menu, in order: keep the plan in Saved (or take it out),
 * set the daily reminder, and read how plans are made. Nothing that loses a
 * plan — a plan is the user's record of a sermon, kept, not managed.
 */
export function getMoreMenuItems(saved: boolean): { key: MoreMenuKey; label: string }[] {
  return [
    { key: "save", label: saved ? "Remove from Saved" : "Save plan" },
    { key: "reminder", label: "Daily reminder" },
    { key: "howMade", label: "How plans are made" },
  ];
}
