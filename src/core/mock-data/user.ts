import type { Reminder, User, UserSettings } from "@/types/domain";

/**
 * "Today" in the mock data is Wednesday 23 September 2026. Every date in it
 * is set relative to that: the active plan started yesterday, the completed
 * one finished three weeks ago.
 */
export const MOCK_TODAY = "2026-09-23";

export const MOCK_USER: User = {
  id: "user-local",
  createdAt: "2026-08-29T20:02:00.000Z",
  updatedAt: "2026-08-29T20:04:00.000Z",
  displayName: "Jordan",
  onboardedAt: "2026-08-29T20:04:00.000Z",
};

export const MOCK_SETTINGS: UserSettings = {
  id: "settings-local",
  createdAt: "2026-08-29T20:02:00.000Z",
  updatedAt: "2026-09-14T08:15:00.000Z",
  userId: MOCK_USER.id,
  theme: "system",
  textSize: "large",
  bibleTranslation: "NIV",
  defaultPlanLength: 6,
  quickCheckByDefault: true,
  hapticsEnabled: true,
};

export const MOCK_REMINDERS: readonly Reminder[] = [
  {
    id: "reminder-daily-study",
    createdAt: "2026-08-29T20:05:00.000Z",
    updatedAt: "2026-09-14T08:15:00.000Z",
    userId: MOCK_USER.id,
    kind: "dailyStudy",
    planId: null,
    enabled: true,
    time: "06:30",
    days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
  },
  {
    id: "reminder-quick-check",
    createdAt: "2026-08-29T20:05:00.000Z",
    updatedAt: "2026-08-29T20:05:00.000Z",
    userId: MOCK_USER.id,
    kind: "quickCheck",
    planId: null,
    enabled: false,
    time: "19:00",
    days: ["mon", "tue", "wed", "thu", "fri"],
  },
];
