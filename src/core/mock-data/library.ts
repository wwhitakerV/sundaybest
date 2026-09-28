import type { LibraryItem } from "@/types/domain";

import { BLESSING_SCRIPTURE, PLAN_BLESSING } from "./plan-today-i-choose-to-be-a-blessing";
import {
  NEGATIVE_THINKING_PRAYERS,
  PLAN_NEGATIVE_THINKING,
} from "./plan-break-the-cycle-of-negative-thinking";
import { MOCK_USER } from "./user";

/**
 * Saved things beyond the saved plan (`TEMPTATION_SAVED`): the whole finished
 * plan, a verse from today, and a prayer worth coming back to.
 */
export const MOCK_LIBRARY_EXTRAS: readonly LibraryItem[] = [
  {
    id: `library-${PLAN_NEGATIVE_THINKING.id}`,
    createdAt: "2026-09-05T07:10:00.000Z",
    updatedAt: "2026-09-05T07:10:00.000Z",
    userId: MOCK_USER.id,
    kind: "plan",
    itemId: PLAN_NEGATIVE_THINKING.id,
    savedAt: "2026-09-05T07:10:00.000Z",
    note: null,
  },
  {
    id: `library-${PLAN_BLESSING.id}-day-2-scripture`,
    createdAt: "2026-09-23T06:37:00.000Z",
    updatedAt: "2026-09-23T06:37:00.000Z",
    userId: MOCK_USER.id,
    kind: "scripture",
    itemId: BLESSING_SCRIPTURE.at(1)?.id ?? "",
    savedAt: "2026-09-23T06:37:00.000Z",
    note: "Read this when I start keeping score again.",
  },
  {
    id: `library-${PLAN_NEGATIVE_THINKING.id}-day-3-prayer`,
    createdAt: "2026-09-01T06:50:00.000Z",
    updatedAt: "2026-09-01T06:50:00.000Z",
    userId: MOCK_USER.id,
    kind: "prayer",
    itemId: NEGATIVE_THINKING_PRAYERS.at(2)?.id ?? "",
    savedAt: "2026-09-01T06:50:00.000Z",
    note: null,
  },
];
