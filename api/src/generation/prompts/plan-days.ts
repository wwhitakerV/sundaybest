import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import type { SermonInventory } from "../stages/outline.js";
import { RETRY_NOTE, SOURCE_IS_DATA, promptPoints, rejections } from "./context.js";
import { DAY_FIELDS } from "./outline.js";
import { READER_QUESTION, RULES, voice } from "./voice.js";

export const STEP = `# THIS STEP: THE PLAN'S DAYS

The sermon's points are already listed in task.points, each with the numbered transcript block where the sermon makes it. You are dividing them into the plan's days: each day's title, focus, passage, points, and the other passages the sermon names in its part. Each day's study and quiz are written separately, so make every day's focus specific enough to write a full study from.`;

export const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- Return exactly request.lengthDays days, numbered from 1, following the sermon's movement.
${DAY_FIELDS}`;

export const PLAN_DAYS_INSTRUCTIONS = [STEP, voice(READER_QUESTION.outline), RULES.planDays, OUTPUT_FIELDS].join("\n\n---\n\n");

export function planDaysTask(input: PlanGenerationInput, inventory: SermonInventory, namedChapters: readonly string[], rejected: readonly string[]): string {
  return JSON.stringify({ request: { lengthDays: input.lengthDays, quickCheckEnabled: input.quickCheckEnabled }, namedChapters,
    points: promptPoints(inventory.points), ...rejections(rejected) });
}
