import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import type { Outline, OutlineDay } from "../stages/outline.js";
import { RETRY_NOTE, SOURCE_IS_DATA, rejections } from "./context.js";
import { INTRO, QUALITY_CHECKS, RULES } from "./rules.js";

export const STEP = `# THIS STEP: ONE DAY

You are writing one day of a plan whose outline is already set. The task gives this day's title, focus, and passage, and every other day's, so you can build on them without repeating them. Write this day's Read section with its Scripture study, its reflections, prayer, sermon clip, and supporting Scripture. The day's quiz is written separately, from your reading.`;

export const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- **readingParagraphs** is an array of 1–20 objects, each with exactly **heading** and **content**. Both must be nonempty plain-text strings. **heading**: a punchy, concept-specific editorial label, usually 2–5 words, maximum 80 characters. **content**: the related substantial teaching, maximum 8,000 characters. Use roughly 3–5 distinct Read blocks when supported by the sermon. After the Read blocks, include Scripture study guidance as the same object type, using the passage reference as its heading. Do not embed headings inside content, return standalone strings, or use Markdown.
- Do not write out the passage's verses: the app shows them in the reader's chosen translation. Refer to verses by number when you discuss them.
- **sermonQuote** is an optional excerpt copied word for word from the transcript, or null. **clipStartSeconds / clipEndSeconds** are integer seconds from the transcript's [hh:mm:ss] blocks, covering the sermonQuote when there is one, taken from the part of the sermon this day's reading covers — never from greetings, announcements, or the opening before the message begins. Both are null when timing is unavailable.
- **reflections** holds 1–2 questions. Do not repeat any question listed in avoidReflections.
- **prayer** has a short title and the 2–4 sentence prayer.
- **supportingScriptures** holds 0–3 passages as described in SUPPORTING SCRIPTURE: canonical full book name, one chapter, numeric verse bounds (10 verses or fewer), and a connection.`;

export const DAY_INSTRUCTIONS = [
  INTRO, STEP, RULES.voice, RULES.studyTime, RULES.sermonFaithfulness,
  RULES.readSection, RULES.scriptureSection, RULES.supportingScripture, RULES.reflectSection,
  RULES.praySection, RULES.avoidRepetition, RULES.transcriptQuality, RULES.insufficientMaterial,
  RULES.timestamps, RULES.removeNonStudy, QUALITY_CHECKS.read, QUALITY_CHECKS.faithfulness, OUTPUT_FIELDS,
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
