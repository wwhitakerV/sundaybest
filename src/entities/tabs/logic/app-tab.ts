/** The tabs that open a plan and Settings' shared pages in their own stack (Fun, hidden, doesn't). */
const APP_TABS = ["home", "plans", "progress", "settings"] as const;

export type AppTab = (typeof APP_TABS)[number];

/** A tab's route name, as one of those tabs — or `fallback` for anywhere else, or nowhere. */
export function toAppTab(name: string | null, fallback: AppTab): AppTab {
  return APP_TABS.find((tab) => tab === name) ?? fallback;
}
