import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { namedChapters } from "../scripture.js";
import type { Outline, OutlineDay } from "../stages/outline.js";
import { RETRY_NOTE, SOURCE_IS_DATA, promptPoints, rejections } from "./context.js";
import { READER_QUESTION, RULES, voice } from "./voice.js";

export const STEP = `# THIS STEP: ONE DAY'S SIX FACULTIES

The plan's outline is set. The task gives this day's title, focus, passage, and the sermon's points it carries. Write this day's six faculties: six short moments, each asking the reader one question and answering it from what the sermon teaches.`;

export const FORMATION = `# HOW TO WRITE THE DAY

The day has six parts, always in this order: SEE, HEAR, UNDERSTAND, DO, SPEAK, EXAMINE. Write all six from this day's points (task.day.points). One point can feed several parts.

For each part, write:
1. pointId: the id of the day's point the part comes from.
2. question: one short question to the reader. SEE asks what they notice. HEAR asks what or who they listen to. UNDERSTAND asks what is true. DO asks what they will do. SPEAK asks what they say. EXAMINE asks what is going on in their heart.
3. answer: two or three sentences that answer the question from what the sermon teaches at that point, in the voice above, said straight to the reader. Say only what the sermon teaches; add nothing it doesn't.
4. commitment: one thing the reader can do today, starting with a verb.

You may also write:
- transition: a few words leading into the part ("Now look closer.")
- reflection: one short line after the answer ("Sit with that.")

Scripture: you may mention only these passages: task.sermonPassages.
Quotation marks: never put the pastor's words in them.

Example of one part:
{
  "faculty": "hear",
  "pointId": "p3",
  "transition": "Now listen closer.",
  "question": "What are you telling yourself while you wait?",
  "answer": "The storm isn't telling you God left. That's the lie you rehearse in the dark, and the longer you rehearse it, the more it sounds like the truth.",
  "reflection": "Sit with that before you choose.",
  "commitment": "Write down one thing God has already done for you."
}`;

export const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- **faculties** holds exactly six parts: faculty ("see", "hear", "understand", "do", "speak", "examine"), pointId, transition or null, question, answer, reflection or null, and commitment.`;

export const FORMATION_INSTRUCTIONS = [STEP, voice(READER_QUESTION.day), RULES.formation, FORMATION, OUTPUT_FIELDS].join("\n\n---\n\n");

export function formationTask(input: PlanGenerationInput, outline: Outline, day: OutlineDay, rejected: readonly string[]): string {
  return JSON.stringify({
    speakerName: outline.speakerName,
    sermonPassages: namedChapters(input.transcriptSegments?.map((segment) => segment.text).join(" ") ?? input.transcript),
    day: {
      dayNumber: day.dayNumber,
      title: day.title,
      focus: day.focus,
      passage: day.scripture.reference,
      points: promptPoints(outline.points.filter((point) => day.pointIds.includes(point.id))),
    },
    ...rejections(rejected),
  });
}
