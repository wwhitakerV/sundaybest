// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM PROMPTS — write your own theory for a step; the rest is prefilled.
//
// Each step's prompt is assembled as:
//
//   1. FIXED — what the step is and what its task data holds  (`STEP` in the step's file)
//   2. YOUR THEORY — everything about how to write it          (below)
//   3. FIXED — the exact JSON it must return                   (`OUTPUT_FIELDS`, and for the
//                                                                quiz `FINISH_THE_VERSE`)
//
// The fixed parts are imported from outline.ts, day.ts and quiz.ts, so they're
// always the live ones. Nothing else changes: the same steps, the same data
// sent with each call, the same JSON schemas the model is held to, and the
// same checks on what comes back.
//
// To use it:
//   1. Write a step's theory below, replacing its `null`, as a `template string`.
//      A step left `null` keeps its whole standard prompt.
//   2. Set `enabled` to true; set it back to false for the standard prompts.
//   3. Bump `version` whenever you change your theory, so every plan records
//      which prompts wrote it (e.g. "sundaybest-staged-2+custom-1").
//
// The worker reloads on save when run with `npm run dev:worker`.
// ─────────────────────────────────────────────────────────────────────────────

import { OUTPUT_FIELDS as DAY_OUTPUT_FIELDS, STEP as DAY_STEP } from "./day.js";
import { OUTPUT_FIELDS as OUTLINE_OUTPUT_FIELDS, STEP as OUTLINE_STEP } from "./outline.js";
import {
  FINISH_THE_VERSE,
  OUTPUT_FIELDS as QUIZ_OUTPUT_FIELDS,
  STEP as QUIZ_STEP,
} from "./quiz.js";

/** The steps whose theory can be replaced. */
export type PromptStep = "outline" | "day" | "quiz";

export type CustomPrompts = {
  enabled: boolean;
  version: string;
  theory: Record<PromptStep, string | null>;
};

const subjectReferrer =
  "Never refer to the speaker of the scripture, author, writer, apostle etc by antyhing other than their actual name. If Jesus, then Jesus. If David, then David. If Paul, then Paul..etc. Never (the speaker, the psalmist, the writer, the author, the apostle etc). Always talk to the reader. Be a discipler, be a pastor, be direct. Use your words to impart spiritual knowledge, rebuke, comfort, care, correction and teaching as it directly relates to the transcript and always maintain 1:1 relevance.";

export const CUSTOM_PROMPTS: CustomPrompts = {
  enabled: true,
  version: "custom-2",
  theory: {
    // THE PLAN STEP — the plan's title, About this plan, and each day's title,
    // focus, and passage.
    //   Prefilled before: what this step is (STEP in outline.ts).
    //   Prefilled after:  the JSON fields to return (OUTPUT_FIELDS in outline.ts).
    outline: `${subjectReferrer} Use the exact tone, voice, semantic, linguistic detail, intonation, and all other writing cues exactly as they appear in the transcript. The reader of this overview should understand exactly what the plan is about. You aren't talking in third person. It is as if the you already are the pastor and you're speaking directly to someone if they asked you "What is this plan about"`, // ← PUT YOUR PLAN (OUTLINE) THEORY HERE

    // THE DAY STEP — once per day: the Read with its headings and Scripture
    // study, reflections, prayer, sermon clip, and supporting Scripture.
    //   Prefilled before: what this step is (STEP in day.ts).
    //   Prefilled after:  the JSON fields to return (OUTPUT_FIELDS in day.ts).
    day: `${subjectReferrer} Use the exact tone, voice, semantic, linguistic detail, intonation, and all other writing cues exactly as they appear in the transcript. The reader of this overview should understand exactly what the plan is about. You aren't talking in third person. It is as if the you already are the pastor and you're speaking directly to someone if they asked you "What are we covering today? How can I apply it? How does the scripture tie into this? Talk to me."`, // ← PUT YOUR DAY THEORY HERE

    // THE QUIZ STEP — once per day: the Quick Check questions.
    //   Prefilled before: what this step is (STEP in quiz.ts).
    //   Prefilled after:  how finish-the-verse questions are built
    //                     (FINISH_THE_VERSE) and the JSON fields to return
    //                     (OUTPUT_FIELDS in quiz.ts).
    quiz: `${subjectReferrer} Use the exact tone, voice, semantic, linguistic detail, intonation, and all other writing cues exactly as they appear in the transcript. The reader of this overview should understand exactly what the plan is about. You aren't talking in third person. It is as if the you already are the pastor and you're speaking directly to someone if they asked you "Can you test my knowledge on what was discussed today?"`, // ← PUT YOUR QUIZ THEORY HERE
  },
};

/** Each step's fixed parts: before the theory, and after it. */
type FixedParts = { before: readonly string[]; after: readonly string[] };

const FIXED: Record<PromptStep, FixedParts> = {
  outline: { before: [OUTLINE_STEP], after: [OUTLINE_OUTPUT_FIELDS] },
  day: { before: [DAY_STEP], after: [DAY_OUTPUT_FIELDS] },
  quiz: { before: [QUIZ_STEP], after: [FINISH_THE_VERSE, QUIZ_OUTPUT_FIELDS] },
};

/** How the standard prompts join their sections. */
const SECTION_BREAK = "\n\n---\n\n";

/**
 * A step's prompt: while custom prompts are on and the step has your theory,
 * its fixed description, your theory, then its fixed output contract;
 * otherwise its standard prompt.
 */
export function selectInstructions(
  step: PromptStep,
  standard: string,
  custom: CustomPrompts = CUSTOM_PROMPTS,
  fixed: FixedParts = FIXED[step],
): string {
  const theory = custom.theory[step];
  if (!custom.enabled || theory === null) return standard;
  return [...fixed.before, theory, ...fixed.after].join(SECTION_BREAK);
}

/** The prompt version a plan records: the standard one, marked with yours while custom prompts are on. */
export function promptVersionFor(standard: string, custom: CustomPrompts = CUSTOM_PROMPTS): string {
  return custom.enabled ? `${standard}+${custom.version}` : standard;
}
