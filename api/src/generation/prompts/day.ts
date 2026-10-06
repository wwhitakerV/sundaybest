import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import type { Outline, OutlineDay } from "../stages/outline.js";
import { RETRY_NOTE, SOURCE_IS_DATA, rejections } from "./context.js";
import { INTRO, QUALITY_CHECKS, RULES } from "./rules.js";

const STEP = `# THIS STEP: ONE DAY

You are writing one day of a plan whose outline is already set. The task gives this day's title, focus, and passage, and every other day's, so you can build on them without repeating them. Write this day's Read section with its Scripture study, its reflections, prayer, sermon clip, and supporting Scripture. The day's quiz is written separately, from your reading.`;

const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- **readingParagraphs** holds the Read section, followed by the Scripture section's study guidance. Plain text only: the app does not render Markdown, so do not use #, *, -, or ** characters. Write a heading as a short sentence of its own.
- Do not write out the passage's verses: the app shows them in the reader's chosen translation. Refer to verses by number when you discuss them.
- **sermonQuote** is an optional excerpt copied word for word from the transcript, or null. **clipStartSeconds / clipEndSeconds** are integer seconds from the transcript's [hh:mm:ss] blocks, covering the sermonQuote when there is one, taken from the part of the sermon this day's reading covers — never from greetings, announcements, or the opening before the message begins. Both are null when timing is unavailable.
- **reflections** holds 1–2 questions. Do not repeat any question listed in avoidReflections.
- **prayer** has a short title and the 2–4 sentence prayer.
- **supportingScriptures** holds 0–3 passages as described in SUPPORTING SCRIPTURE: canonical full book name, one chapter, numeric verse bounds (10 verses or fewer), and a connection.`;

export const DAY_INSTRUCTIONS = [
  INTRO, STEP, RULES.primaryGoal, RULES.studyTime, RULES.sermonFaithfulness, RULES.contentPriority,
  RULES.readSection, RULES.voice, RULES.scriptureSection, RULES.supportingScripture, RULES.reflectSection,
  RULES.praySection, RULES.avoidRepetition, RULES.transcriptQuality, RULES.insufficientMaterial,
  RULES.timestamps, RULES.removeNonStudy, RULES.depthStandard,
  ["# FINAL QUALITY CHECK", QUALITY_CHECKS.duration, QUALITY_CHECKS.read, QUALITY_CHECKS.scripture,
    QUALITY_CHECKS.reflection, QUALITY_CHECKS.prayer, QUALITY_CHECKS.faithfulness, QUALITY_CHECKS.usefulness].join("\n\n"),
  OUTPUT_FIELDS,
].join("\n\n---\n\n");

const describe = (day: OutlineDay) => ({ dayNumber: day.dayNumber, title: day.title, focus: day.focus, passage: day.scripture.reference });

export function dayTask(input: PlanGenerationInput, outline: Outline, day: OutlineDay, avoidReflections: readonly string[], rejected: readonly string[]): string {
  return JSON.stringify({
    request: { lengthDays: input.lengthDays },
    plan: { title: outline.title, days: outline.days.map(describe) },
    day: describe(day),
    avoidReflections,
    ...rejections(rejected),
  });
}
