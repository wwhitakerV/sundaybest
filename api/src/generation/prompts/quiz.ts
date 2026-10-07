import type { OutlineDay } from "../stages/outline.js";
import type { PassageText } from "../stages/quiz.js";
import { RETRY_NOTE, SOURCE_IS_DATA, rejections } from "./context.js";
import { INTRO, QUALITY_CHECKS, RULES } from "./rules.js";
import type { ReadingParagraph } from "../reading.js";

export const STEP = `# THIS STEP: ONE DAY'S QUICK CHECK

You are writing the Quick Check for one day, from that day's finished reading. The task gives the reading, the day's focus and passage, and the passage's text in the BSB and the KJV. Test what the reader studied today.`;

export const FINISH_THE_VERSE = `# FINISH THE VERSE

Include 2–3 finish-the-verse questions among the day's questions, on memorable, meaningful words in the day's passage — never trivial words.

- Choose a verse from the day's passage, using passageText.BSB and passageText.KJV in the task.
- For each translation, give the answer: the exact words to blank, copied from that translation's text of the verse (the wording usually differs between translations), and three plausible wrong completions that fit the sentence.
- Blank a meaningful phrase of 1–5 words, usually near the end of the verse.
- The server builds the question from the real verse text. Never write out the verse yourself.
- The explanation teaches why those words matter, without quoting either translation.`;

export const OUTPUT_FIELDS = `# OUTPUT FIELDS

Return only JSON matching the supplied response schema. ${SOURCE_IS_DATA} ${RETRY_NOTE}

- Aim for 9–10 questions: the server removes any question it cannot verify, and the day needs at least 7.
- When the task gives questionsNeeded, the questions in avoidPrompts are already kept for this day: write at least questionsNeeded new questions that complete the quiz (one or two extra is welcome, since unverifiable questions are removed). Mix difficulty as described above; difficulty guides your writing and is not a returned field.
- **multipleChoice**: a prompt, exactly four distinct choices with one correct, an explanation, and verse null. A sermon question has an evidenceQuote copied word for word from the transcript that supports its answer. A scripture question is about the day's passage and has a null evidenceQuote.
- **finishTheVerse**: source "scripture", prompt, choices, and evidenceQuote null, an explanation, and verse as described in FINISH THE VERSE.
- Do not repeat any question listed in avoidPrompts.`;

export const QUIZ_INSTRUCTIONS = [
  INTRO, STEP, RULES.voice, RULES.sermonFaithfulness, RULES.quizzes,
  RULES.quizContent, RULES.quizAnswers, RULES.quizDifficulty,
  FINISH_THE_VERSE, QUALITY_CHECKS.quiz, OUTPUT_FIELDS,
].join("\n\n---\n\n");

export function quizTask(day: OutlineDay, readingParagraphs: readonly ReadingParagraph[], passageText: PassageText, avoidPrompts: readonly string[],
  questionsNeeded: number | null, rejected: readonly string[]): string {
  return JSON.stringify({
    day: { dayNumber: day.dayNumber, title: day.title, focus: day.focus, passage: day.scripture.reference, readingParagraphs },
    passageText,
    avoidPrompts,
    ...(questionsNeeded === null ? {} : { questionsNeeded }),
    ...rejections(rejected),
  });
}
