import type { Id, Prayer, Reflection, ScripturePassage, SermonSource } from "@/types/domain";

import type { AppState } from "../state";
import { findById, listAll } from "../table";

export function getSermonById(state: AppState, sermonId: Id): SermonSource | null {
  return findById(state.sermons, sermonId);
}

/** The sermon a plan is built from. */
export function getSermonForPlan(state: AppState, planId: Id): SermonSource | null {
  const plan = findById(state.plans, planId);
  return plan ? findById(state.sermons, plan.sermonId) : null;
}

/** A day's Scripture passage. */
export function getScriptureForDay(state: AppState, dayId: Id): ScripturePassage | null {
  const day = findById(state.planDays, dayId);
  return day ? findById(state.scripture, day.scriptureId) : null;
}

/** A day's reflection questions, in order. */
export function getReflectionsForDay(state: AppState, dayId: Id): Reflection[] {
  return listAll(state.reflections)
    .filter((reflection) => reflection.planDayId === dayId)
    .sort((a, b) => a.order - b.order);
}

export function getPrayerForDay(state: AppState, dayId: Id): Prayer | null {
  return listAll(state.prayers).find((prayer) => prayer.planDayId === dayId) ?? null;
}
