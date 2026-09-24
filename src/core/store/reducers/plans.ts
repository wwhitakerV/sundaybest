import type { IsoDate, IsoDateTime, Plan, SermonPlatform, SermonSource } from "@/types/domain";

import type { AppAction } from "../actions";
import type { AppState } from "../state";
import { findById, listAll, withRecord, withoutRecord } from "../table";
import { canMovePlan } from "../transitions";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

/** Plans the user can study in: built and not put away. */
export function isStudyable(plan: Plan): boolean {
  return plan.status === "ready" || plan.status === "active";
}

/** A ready plan, started; any other plan as it is. */
export function started(plan: Plan, today: IsoDate, at: IsoDateTime): Plan {
  // Only a ready plan starts; an active one already has, and the rest can't.
  if (plan.status !== "ready") return plan;
  return { ...plan, status: "active", startDate: today, startedAt: at, updatedAt: at };
}

/** An active plan, completed; any other plan as it is. */
export function completed(plan: Plan, at: IsoDateTime): Plan {
  if (!canMovePlan(plan.status, "completed")) return plan;
  return { ...plan, status: "completed", completedAt: at, updatedAt: at };
}

/** The state with `plan` in it, or the same state if nothing changed. */
export function withPlan(state: AppState, before: Plan, after: Plan): AppState {
  return after === before ? state : { ...state, plans: withRecord(state.plans, after) };
}

function detectPlatform(url: string): SermonPlatform {
  if (/(^|[/.])(youtube\.com|youtu\.be)\b/i.test(url)) return "youtube";
  if (/(^|[/.])vimeo\.com\b/i.test(url)) return "vimeo";
  return "other";
}

/** A new draft plan, and a placeholder for its sermon until the plan is built. */
export function createPlan(state: AppState, action: Action<"plan/create">): AppState {
  const url = action.sourceUrl.trim();
  if (!url || findById(state.plans, action.planId) || findById(state.sermons, action.sermonId)) {
    return state;
  }
  const sermon: SermonSource = {
    id: action.sermonId,
    createdAt: action.at,
    updatedAt: action.at,
    url,
    platform: detectPlatform(url),
    title: "",
    speaker: null,
    church: null,
    thumbnailUrl: null,
    durationSeconds: null,
    publishedOn: null,
    transcriptStatus: "processing",
    transcript: [],
  };
  const plan: Plan = {
    id: action.planId,
    createdAt: action.at,
    updatedAt: action.at,
    userId: state.user.id,
    sermonId: sermon.id,
    title: "",
    status: "draft",
    lengthDays: action.lengthDays,
    quickCheckEnabled: action.quickCheckEnabled,
    startDate: null,
    startedAt: null,
    completedAt: null,
    archivedAt: null,
  };
  return {
    ...state,
    sermons: withRecord(state.sermons, sermon),
    plans: withRecord(state.plans, plan),
  };
}

/**
 * A plan's title, any time before it's archived; its length and Quick Check
 * only while it's a draft — its days are built to them.
 */
export function updatePlan(state: AppState, action: Action<"plan/update">): AppState {
  const plan = findById(state.plans, action.planId);
  if (!plan || plan.status === "archived") return state;
  const { title, lengthDays, quickCheckEnabled } = action.changes;
  const reshapes = lengthDays !== undefined || quickCheckEnabled !== undefined;
  if (reshapes && plan.status !== "draft") return state;
  const next: Plan = {
    ...plan,
    title: title ?? plan.title,
    lengthDays: lengthDays ?? plan.lengthDays,
    quickCheckEnabled: quickCheckEnabled ?? plan.quickCheckEnabled,
  };
  const changed =
    next.title !== plan.title ||
    next.lengthDays !== plan.lengthDays ||
    next.quickCheckEnabled !== plan.quickCheckEnabled;
  return changed ? withPlan(state, plan, { ...next, updatedAt: action.at }) : state;
}

export function startPlan(state: AppState, action: Action<"plan/start">): AppState {
  const plan = findById(state.plans, action.planId);
  return plan ? withPlan(state, plan, started(plan, action.today, action.at)) : state;
}

/** Only an active plan with every one of its days done. */
export function completePlan(state: AppState, action: Action<"plan/complete">): AppState {
  const plan = findById(state.plans, action.planId);
  if (!plan) return state;
  const days = listAll(state.planDays).filter((day) => day.planId === plan.id);
  const allDone =
    days.length === plan.lengthDays && days.every((day) => day.status === "completed");
  return allDone ? withPlan(state, plan, completed(plan, action.at)) : state;
}

/** Any plan but one being built, or one already archived. */
export function archivePlan(state: AppState, action: Action<"plan/archive">): AppState {
  const plan = findById(state.plans, action.planId);
  if (!plan || !canMovePlan(plan.status, "archived")) return state;
  return withPlan(state, plan, {
    ...plan,
    status: "archived",
    archivedAt: action.at,
    updatedAt: action.at,
  });
}

function savedEntries(state: AppState, planId: string) {
  return listAll(state.library).filter((item) => item.kind === "plan" && item.itemId === planId);
}

/** A built plan into the library — once. */
export function savePlan(state: AppState, action: Action<"plan/save">): AppState {
  const plan = findById(state.plans, action.planId);
  const savable = plan && (isStudyable(plan) || plan.status === "completed");
  if (!savable || savedEntries(state, plan.id).length > 0) return state;
  if (findById(state.library, action.libraryItemId)) return state;
  return {
    ...state,
    library: withRecord(state.library, {
      id: action.libraryItemId,
      createdAt: action.at,
      updatedAt: action.at,
      userId: state.user.id,
      kind: "plan",
      itemId: plan.id,
      savedAt: action.at,
      note: null,
    }),
  };
}

export function removeSavedPlan(state: AppState, action: Action<"plan/removeSaved">): AppState {
  const saved = savedEntries(state, action.planId);
  if (saved.length === 0) return state;
  return {
    ...state,
    library: saved.reduce((library, item) => withoutRecord(library, item.id), state.library),
  };
}
