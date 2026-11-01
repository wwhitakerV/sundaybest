import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import type { Outline, OutlineDay } from "../stages/outline.js";
import { RETRY_NOTE, SOURCE_IS_DATA, promptPoints, rejections } from "./context.js";
import { READER_QUESTION, RULES, voice } from "./voice.js";

export const STEP = `# THIS STEP: ONE DAY

You are writing one day of a plan whose outline is already set. The task gives this day's title, focus, passage, the other passages the sermon names in its part, and the sermon's points it carries, and every other day's, so you can build on them without repeating them. Write this day's Read section with its Scripture study, its reflections, and prayer. The day's quiz is written separately, from your reading.`;

export const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- **readingParagraphs** is an array of 1–20 objects, each with exactly **heading**, **content**, and **pointIds**. Heading and content must be nonempty plain-text strings; pointIds are the ids of the day's points the section covers (empty for the Scripture study when it covers none). Together the sections cover every one of the day's points. **heading**: a punchy, concept-specific editorial label, usually 2–5 words, maximum 80 characters. **content**: the related substantial teaching, maximum 8,000 characters. Use roughly 3–5 distinct Read blocks when supported by the sermon. After the Read blocks, include Scripture study guidance as the same object type, using the passage reference as its heading. Do not embed headings inside content, return standalone strings, or use Markdown.
- Do not write out the passage's verses: the app shows them in the reader's chosen translation. Refer to verses by number when you discuss them.
- **reflections** holds 1–2 questions. Do not repeat any question listed in avoidReflections.
- **prayer** has a short title and the 2–4 sentence prayer.`;

export const DAY_INSTRUCTIONS = [STEP, voice(READER_QUESTION.day), RULES.day, OUTPUT_FIELDS].join("\n\n---\n\n");

const describe = (day: OutlineDay) => ({ dayNumber: day.dayNumber, title: day.title, focus: day.focus, passage: day.scripture.reference });

export function dayTask(input: PlanGenerationInput, outline: Outline, day: OutlineDay, avoidReflections: readonly string[], rejected: readonly string[]): string {
  return JSON.stringify({
    request: { lengthDays: input.lengthDays },
    speakerName: outline.speakerName,
    plan: { days: outline.days.map(describe) },
    day: { ...describe(day), alsoReferenced: day.alsoReferenced.map((passage) => passage.reference),
      points: promptPoints(outline.points.filter((point) => day.pointIds.includes(point.id))) },
    avoidReflections,
    ...rejections(rejected),
  });
}
