import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { RETRY_NOTE, SOURCE_IS_DATA, rejections } from "./context.js";
import { READER_QUESTION, RULES, voice } from "./voice.js";

export const STEP = `# THIS STEP: THE PLAN

You are writing the plan's outline: About This Plan, the inventory of every point the sermon makes, and each day's title, focus, passage, and points. Each day's study and quiz are written separately from this outline, so make every day's focus specific enough to write a full study from.`;

/** How each day is written, by the plan step and by the plan-days step alike. */
export const DAY_FIELDS = `- **days[].title** is the day title. **days[].focus** is the day's thesis: one or two direct sentences stating the truth or distinction at its center, not a description of what the day or reader will do.
- **days[].pointIds** are the points this day carries, from the part of the sermon it covers. Put every point on exactly one day.
- **days[].scripture** is the day's passage: a canonical full book name, one chapter, numeric verse bounds. It must come from one of the chapters in task.namedChapters: the chapters the sermon explicitly names. Never choose a chapter outside that list, even one the sermon alludes to. No two days may share or overlap verses: each day takes its own verses, even when days share a chapter.
- **days[].alsoReferenced** are all the other passages the sermon names in this day's part — often several: canonical full book name, chapter, and verse bounds, or null verses when only the chapter is named. Every chapter in task.namedChapters goes on some day, as its passage or here.`;

export const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- Return exactly request.lengthDays days, numbered from 1, following the sermon's movement.
- **speakerName** is the preacher's name exactly as the transcript or the video's title gives it, or null when neither does.
- **points** are the sermon's main points: what it teaches, warns, promises, or calls people to do (kind "teaching", "warning", "promise", or "call") — usually 5 to 12, never a passing remark. Each has a short id ("p1", "p2"…), one sentence saying it, and evidenceBlocks: the numbered transcript blocks where the sermon makes it ([b45 00:05:31] …), one to three side by side.
${DAY_FIELDS}
- **about.overview** holds 1–3 short paragraphs written as a direct editorial introduction to the biblical subject, not a description of the plan. **about.scripturesReferenced** lists each Scripture named in the sermon, each with an evidenceQuote copied word for word from the transcript that names it; set verseStart and verseEnd to null when only a chapter is named. **about.keyTakeaways** holds 3–7 one-sentence, directly stated takeaways.
- If the transcript names no Scripture, or cannot support a faithful plan at all, refuse instead of returning a plan.`;

export const OUTLINE_INSTRUCTIONS = [STEP, voice(READER_QUESTION.outline, true), RULES.outline, OUTPUT_FIELDS].join("\n\n---\n\n");

export function outlineTask(input: PlanGenerationInput, namedChapters: readonly string[], rejected: readonly string[]): string {
  return JSON.stringify({ request: { lengthDays: input.lengthDays, quickCheckEnabled: input.quickCheckEnabled }, namedChapters, ...rejections(rejected) });
}
