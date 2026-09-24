import { SAMPLE_PLAN_ID } from "@/core/mock-data";
import type { Plan } from "./types";

export { SAMPLE_PLAN_ID };

/**
 * A plan can be 1 to 7 days long, and screens must never assume otherwise.
 * These cover the shape of that range for manual testing: a 1-day plan (so
 * "day 1 finishes the whole plan" is reachable), a 3-day plan, and a 7-day
 * plan, plus the sample plan Welcome's "See a sample plan" opens.
 */
export const MOCK_PLANS: readonly Plan[] = [
  {
    id: SAMPLE_PLAN_ID,
    title: "God Won't Leave You",
    totalDays: 5,
    currentDay: 1,
    completedDays: [],
    completed: false,
  },
  {
    id: "plan-one-day",
    title: "A Single Day of Rest",
    totalDays: 1,
    currentDay: 1,
    completedDays: [],
    completed: false,
  },
  {
    id: "plan-three-day",
    title: "Faith Through the Storm",
    totalDays: 3,
    currentDay: 2,
    completedDays: [1],
    completed: false,
  },
  {
    id: "plan-seven-day",
    title: "A Week of Gratitude",
    totalDays: 7,
    currentDay: 4,
    completedDays: [1, 2, 3],
    completed: false,
  },
];

export function getMockPlan(id: string): Plan | undefined {
  return MOCK_PLANS.find((plan) => plan.id === id);
}
