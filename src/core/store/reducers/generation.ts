import type { PlanDay, PlanGeneration, Prayer, Reflection } from "@/types/domain";

import type { AppAction, GeneratedPlanContent } from "../actions";
import type { AppState } from "../state";
import { findById, withRecord, withRecords } from "../table";
import { canAdvanceGeneration, canMovePlan, isGenerationRunning } from "../transitions";
import { withPlan } from "./plans";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

function withGeneration(state: AppState, generation: PlanGeneration): AppState {
  return { ...state, generation };
}

/** The build under way, and the plan it's building — or null. */
function runningBuild(state: AppState) {
  const { generation } = state;
  if (!generation || !isGenerationRunning(generation.status) || !generation.planId) return null;
  const plan = findById(state.plans, generation.planId);
  return plan?.status === "generating" ? { generation, plan } : null;
}

/** Building a draft plan — only while no other build is under way. */
export function startPlanGeneration(state: AppState, action: Action<"generation/start">): AppState {
  const plan = findById(state.plans, action.planId);
  const sermon = plan ? findById(state.sermons, plan.sermonId) : null;
  const busy = state.generation !== null && isGenerationRunning(state.generation.status);
  if (!plan || !sermon || busy || !canMovePlan(plan.status, "generating")) return state;
  const generation: PlanGeneration = {
    id: action.generationId,
    createdAt: action.at,
    updatedAt: action.at,
    userId: state.user.id,
    sourceUrl: sermon.url,
    lengthDays: plan.lengthDays,
    quickCheckEnabled: plan.quickCheckEnabled,
    status: "validating",
    attempt: 1,
    sermonId: sermon.id,
    planId: plan.id,
    startedAt: action.at,
    finishedAt: null,
    error: null,
  };
  const building = withPlan(state, plan, { ...plan, status: "generating", updatedAt: action.at });
  return withGeneration(building, generation);
}

/** The build's next stage — forward only. */
export function updateGenerationStep(state: AppState, action: Action<"generation/step">): AppState {
  const build = runningBuild(state);
  if (!build || !canAdvanceGeneration(build.generation.status, action.status)) return state;
  return withGeneration(state, {
    ...build.generation,
    status: action.status,
    updatedAt: action.at,
  });
}

/** Whether built content fits its plan: one day per day of its length, numbered 1 up, all its own. */
function fitsPlan(content: GeneratedPlanContent, planId: string, lengthDays: number): boolean {
  const numbers = content.days.map((day) => day.dayNumber).sort((a, b) => a - b);
  return (
    content.days.length === lengthDays &&
    numbers.every((number, index) => number === index + 1) &&
    content.days.every((day) => day.planId === planId) &&
    content.quizzes.every((quiz) => quiz.planId === planId)
  );
}

/**
 * The build finished: the plan is ready, with its days — the first open,
 * the rest locked, nothing done yet — and its sermon filled in. Content that
 * doesn't fit the plan is refused.
 */
export function completePlanGeneration(
  state: AppState,
  action: Action<"generation/complete">,
): AppState {
  const build = runningBuild(state);
  const { content, at } = action;
  if (!build || !fitsPlan(content, build.plan.id, build.plan.lengthDays)) return state;
  if (!build.plan.quickCheckEnabled && content.quizzes.length > 0) return state;

  const days = content.days.map((day): PlanDay => ({
    ...day,
    status: day.dayNumber === 1 ? "available" : "locked",
    completedSteps: [],
    scheduledOn: null,
    startedAt: null,
    completedAt: null,
  }));
  const reflections = content.reflections.map((reflection): Reflection => ({
    ...reflection,
    answer: null,
    answeredAt: null,
  }));
  const prayers = content.prayers.map((prayer): Prayer => ({ ...prayer, prayedAt: null }));
  const sermon = findById(state.sermons, build.plan.sermonId);

  const filled: AppState = {
    ...state,
    sermons: sermon
      ? withRecord(state.sermons, { ...sermon, ...content.sermon, updatedAt: at })
      : state.sermons,
    planDays: withRecords(state.planDays, days),
    scripture: withRecords(state.scripture, content.scripture),
    reflections: withRecords(state.reflections, reflections),
    prayers: withRecords(state.prayers, prayers),
    quizzes: withRecords(state.quizzes, content.quizzes),
    quizQuestions: withRecords(state.quizQuestions, content.quizQuestions),
  };
  const ready = withPlan(filled, build.plan, {
    ...build.plan,
    title: content.title,
    status: "ready",
    updatedAt: at,
  });
  return withGeneration(ready, {
    ...build.generation,
    status: "completed",
    finishedAt: at,
    updatedAt: at,
  });
}

/** The build failed: the reason kept, and the plan back to a draft to try again. */
export function failPlanGeneration(state: AppState, action: Action<"generation/fail">): AppState {
  const build = runningBuild(state);
  if (!build) return state;
  const draft = withPlan(state, build.plan, {
    ...build.plan,
    status: "draft",
    updatedAt: action.at,
  });
  return withGeneration(draft, {
    ...build.generation,
    status: "failed",
    error: action.error,
    finishedAt: action.at,
    updatedAt: action.at,
  });
}

/** A failed build, from the top — only a failed one, for a plan still waiting as a draft. */
export function retryPlanGeneration(state: AppState, action: Action<"generation/retry">): AppState {
  const { generation } = state;
  if (generation?.status !== "failed" || !generation.planId) return state;
  const plan = findById(state.plans, generation.planId);
  if (!plan || !canMovePlan(plan.status, "generating")) return state;
  const building = withPlan(state, plan, { ...plan, status: "generating", updatedAt: action.at });
  return withGeneration(building, {
    ...generation,
    status: "validating",
    attempt: generation.attempt + 1,
    error: null,
    startedAt: action.at,
    finishedAt: null,
    updatedAt: action.at,
  });
}
