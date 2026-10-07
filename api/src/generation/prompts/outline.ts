import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { RETRY_NOTE, SOURCE_IS_DATA, rejections } from "./context.js";
import { INTRO, QUALITY_CHECKS, RULES } from "./rules.js";

export const STEP = `# THIS STEP: THE PLAN

You are writing the plan's outline: its title, About This Plan, and each day's title, focus, and passage. Each day's study and quiz are written separately from this outline, so make every day's focus specific enough to write a full study from.`;

export const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- Return exactly request.lengthDays days, numbered from 1, following the sermon's movement.
- **days[].title** is the day title. **days[].focus** is the day's thesis: one or two direct sentences stating the truth or distinction at its center, not a description of what the day or reader will do.
- **days[].scripture** is the day's passage: a canonical full book name, one chapter, numeric verse bounds. It must come from one of the chapters in task.namedChapters: the chapters the sermon explicitly names. Never choose a chapter outside that list, even one the sermon alludes to. No two days may share or overlap verses: each day takes its own verses, even when days share a chapter.
- **about.overview** holds 1–3 short paragraphs written as a direct editorial introduction to the biblical subject, not a description of the plan. **about.scripturesReferenced** lists each Scripture named in the sermon, each with an evidenceQuote copied word for word from the transcript that names it; set verseStart and verseEnd to null when only a chapter is named. **about.keyTakeaways** holds 3–7 one-sentence, directly stated takeaways.
- If the transcript names no Scripture, or cannot support a faithful plan at all, refuse instead of returning a plan.`;

export const OUTLINE_INSTRUCTIONS = [
  INTRO, STEP, RULES.voice, RULES.planLength, RULES.planProgression,
  RULES.sermonFaithfulness, RULES.dayTitles, RULES.dayFocus,
  RULES.scriptureDeduplication, RULES.aboutThisPlan, RULES.transcriptQuality,
  RULES.insufficientMaterial, RULES.removeNonStudy, QUALITY_CHECKS.about, OUTPUT_FIELDS,
].join("\n\n---\n\n");

export function outlineTask(input: PlanGenerationInput, namedChapters: readonly string[], rejected: readonly string[]): string {
  return JSON.stringify({ request: { lengthDays: input.lengthDays, quickCheckEnabled: input.quickCheckEnabled }, namedChapters, ...rejections(rejected) });
}
