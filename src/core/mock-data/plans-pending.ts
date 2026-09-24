import type { Plan, PlanGeneration } from "@/types/domain";

import { SERMON_NEIGHBOR, SERMON_SALT } from "./sermons";
import { MOCK_USER } from "./user";

/**
 * Plans before they have days: one just created in New Plan, one being
 * built from its sermon right now.
 */

/** Newly created: the link is pasted and checked, the length not yet confirmed. */
export const PLAN_SALT: Plan = {
  id: "plan-salt-and-light",
  createdAt: "2026-09-23T12:05:00.000Z",
  updatedAt: "2026-09-23T12:05:40.000Z",
  userId: MOCK_USER.id,
  sermonId: SERMON_SALT.id,
  title: "Salt and Light",
  status: "draft",
  lengthDays: 5,
  quickCheckEnabled: true,
  startDate: null,
  startedAt: null,
  completedAt: null,
  archivedAt: null,
  isSample: false,
};

/** Being built right now — see `MOCK_GENERATION`. */
export const PLAN_NEIGHBOR: Plan = {
  id: "plan-who-is-my-neighbor",
  createdAt: "2026-09-23T12:20:00.000Z",
  updatedAt: "2026-09-23T12:21:00.000Z",
  userId: MOCK_USER.id,
  sermonId: SERMON_NEIGHBOR.id,
  title: "Who Is My Neighbor?",
  status: "generating",
  lengthDays: 4,
  quickCheckEnabled: true,
  startDate: null,
  startedAt: null,
  completedAt: null,
  archivedAt: null,
  isSample: false,
};

/** The plan being built: its sermon is in, and its days are being written. */
export const MOCK_GENERATION: PlanGeneration = {
  id: "generation-who-is-my-neighbor",
  createdAt: "2026-09-23T12:20:00.000Z",
  updatedAt: "2026-09-23T12:21:00.000Z",
  userId: MOCK_USER.id,
  sourceUrl: SERMON_NEIGHBOR.url,
  lengthDays: PLAN_NEIGHBOR.lengthDays,
  quickCheckEnabled: PLAN_NEIGHBOR.quickCheckEnabled,
  status: "writingDays",
  attempt: 1,
  sermonId: SERMON_NEIGHBOR.id,
  planId: PLAN_NEIGHBOR.id,
  startedAt: "2026-09-23T12:20:05.000Z",
  finishedAt: null,
  error: null,
};
