import type { LibraryItem, UserProgress } from "@/types/domain";

import { CHOOSE_SCRIPTURE, PLAN_CHOOSE } from "./plan-choose";
import { GRATITUDE_PRAYERS, PLAN_GRATITUDE } from "./plan-gratitude";
import { MOCK_USER } from "./user";

/**
 * The user's history: the seven mornings of the completed plan (30 Aug – 5
 * Sep), then yesterday's first day of the active one. Today isn't finished
 * yet, so the current streak is one day; the longest is seven.
 */
export const MOCK_PROGRESS: UserProgress = {
  id: "progress-local",
  createdAt: "2026-08-29T20:04:00.000Z",
  updatedAt: "2026-09-22T06:52:00.000Z",
  userId: MOCK_USER.id,
  currentStreakDays: 1,
  longestStreakDays: 7,
  lastStudiedOn: "2026-09-22",
  studiedOn: [
    "2026-08-30",
    "2026-08-31",
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
    "2026-09-05",
    "2026-09-22",
  ],
  completedDayCount: 8,
  completedPlanCount: 1,
};

/**
 * Saved things beyond the saved plan (`REST_SAVED`): the whole finished
 * plan, a verse from today, and a prayer worth coming back to.
 */
export const MOCK_LIBRARY_EXTRAS: readonly LibraryItem[] = [
  {
    id: `library-${PLAN_GRATITUDE.id}`,
    createdAt: "2026-09-05T07:10:00.000Z",
    updatedAt: "2026-09-05T07:10:00.000Z",
    userId: MOCK_USER.id,
    kind: "plan",
    itemId: PLAN_GRATITUDE.id,
    savedAt: "2026-09-05T07:10:00.000Z",
    note: null,
  },
  {
    id: `library-${PLAN_CHOOSE.id}-day-2-scripture`,
    createdAt: "2026-09-23T06:37:00.000Z",
    updatedAt: "2026-09-23T06:37:00.000Z",
    userId: MOCK_USER.id,
    kind: "scripture",
    itemId: CHOOSE_SCRIPTURE.at(1)?.id ?? "",
    savedAt: "2026-09-23T06:37:00.000Z",
    note: "Read this when I start keeping score again.",
  },
  {
    id: `library-${PLAN_GRATITUDE.id}-day-3-prayer`,
    createdAt: "2026-09-01T06:50:00.000Z",
    updatedAt: "2026-09-01T06:50:00.000Z",
    userId: MOCK_USER.id,
    kind: "prayer",
    itemId: GRATITUDE_PRAYERS.at(2)?.id ?? "",
    savedAt: "2026-09-01T06:50:00.000Z",
    note: null,
  },
];
