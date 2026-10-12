/** What Plan Detail's More menu offers, by key. */
export type MoreMenuKey = "reminder" | "howMade" | "reset";

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
