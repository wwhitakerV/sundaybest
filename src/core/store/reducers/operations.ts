import type { AppAction } from "../actions";
import type { AppState } from "../state";
import { completePlanDay } from "./days";
import { clearReflection, markPrayed, saveReflection, updateReflection } from "./devotion";
import { startPlanGeneration } from "./generation";
import { createPlan } from "./plans";
import { updateReminderEnabled, updateReminderTime } from "./settings";

/**
 * Domain operations that are several changes, each one named action and one
 * reducer step — one transition to test, and no way to fire half of it. Each
 * is exactly its fine-grained actions applied in order.
 */

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

/**
 * The day finished from the study. The prayer goes first: completing the
 * plan's last day completes the plan, after which it can't be prayed.
 */
export function finishPlanDay(state: AppState, action: Action<"planDay/finish">): AppState {
  const { dayId, prayerId, today, at } = action;
  const prayed = prayerId ? markPrayed(state, { type: "prayer/markPrayed", prayerId, at }) : state;
  return completePlanDay(prayed, { type: "planDay/complete", dayId, today, at });
}

/** Everything typed this visit, in the order it's listed. */
export function commitReflections(state: AppState, action: Action<"reflection/commit">): AppState {
  const { at } = action;
  return action.writes.reduce((next, write) => {
    if (write.kind === "clear") {
      return clearReflection(next, {
        type: "reflection/clear",
        reflectionId: write.reflectionId,
        at,
      });
    }
    const { reflectionId, answer } = write;
    return write.kind === "save"
      ? saveReflection(next, { type: "reflection/save", reflectionId, answer, at })
      : updateReflection(next, { type: "reflection/update", reflectionId, answer, at });
  }, state);
}

/** A plan made and its build started. */
export function createAndBuildPlan(
  state: AppState,
  action: Action<"plan/createAndBuild">,
): AppState {
  const { generationId, ...plan } = action;
  const created = createPlan(state, { ...plan, type: "plan/create" });
  return startPlanGeneration(created, {
    type: "generation/start",
    generationId,
    planId: plan.planId,
    at: plan.at,
  });
}

/** The reminder turned on at a time. */
export function turnOnReminderAt(state: AppState, action: Action<"settings/reminderOn">): AppState {
  const { reminderId, time, at } = action;
  const enabled = updateReminderEnabled(state, {
    type: "settings/reminderEnabled",
    reminderId,
    enabled: true,
    at,
  });
  return updateReminderTime(enabled, { type: "settings/reminderTime", reminderId, time, at });
}
