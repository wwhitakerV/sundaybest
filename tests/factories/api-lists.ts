import type {
  ApiMyReflectionPrompt,
  ApiRecalledQuickCheck,
  ApiWeekHistory,
  ApiWeekHistoryPlan,
} from "@/core/api/contracts";
import { uuid } from "./api-plans";
import { defineFactory } from "./build";

/** A reflection question in the reader's plans (`/v1/me/reflections`). */
export const aReflectionPrompt = defineFactory<ApiMyReflectionPrompt>(() => ({
  id: uuid(9001),
  question: "Where did you see grace this week?",
  reference: "Romans 5:1-11",
  planId: uuid(9100),
  planTitle: "Peace with God",
  thumbnailUrl: null,
  dayNumber: 2,
}));

/** A finished Quick Check (`/v1/me/quick-checks`), all correct. */
export const aRecalledQuickCheck = defineFactory<ApiRecalledQuickCheck>(() => ({
  quizId: uuid(9201),
  planId: uuid(9100),
  planTitle: "Peace with God",
  thumbnailUrl: null,
  dayNumber: 2,
  reference: "Romans 5:1-11",
  completedAt: "2026-09-20T12:00:00.000Z",
  questions: [
    {
      id: uuid(9301),
      prompt: "Through whom do we have peace with God?",
      answer: "Jesus",
      chosen: "Jesus",
      correct: true,
      scripture: false,
      reference: null,
    },
  ],
}));

/** A plan in a week a plan ran in (`/v1/me/weeks`). */
export const aWeekPlan = defineFactory<ApiWeekHistoryPlan>(() => ({
  planId: uuid(9100),
  title: "Peace with God",
  church: "Grace Church",
  thumbnailUrl: null,
  thumbnailColors: [],
  passages: [{ reference: "Romans 5:1-11", done: true }],
  reflectionIds: [],
}));

/** A week a plan ran in (`/v1/me/weeks`). */
export const aWeek = defineFactory<ApiWeekHistory>(() => ({
  weekStart: "2026-09-20",
  daysStudied: 3,
  plans: [aWeekPlan()],
}));
