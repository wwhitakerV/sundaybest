import type { PlanGenerationInput } from "../../src/providers/plan-generation-provider.js";
import type { StageCaller, StageKind, StageRequest } from "../../src/generation/pipeline.js";
import type { DayOutput } from "../../src/generation/stages/day.js";
import type { OutlineOutput } from "../../src/generation/stages/outline.js";
import type { QuizOutput, QuizOutputQuestion } from "../../src/generation/stages/quiz.js";
import { formatTranscript } from "../../src/generation/transcript.js";
import { parseEnv } from "../../src/config/env-schema.js";

export const sourceQuote = "Turn to John chapter three verse sixteen. God loved the world and gave His Son.";
/** Read aloud, as a sermon does, so the transcript teaches from Scripture: three chapters named, two verses read. */
const scriptureReading = "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish. "
  + "Psalm 23 says the Lord is my shepherd; I shall not want. And Ephesians 2: it is by grace you have been saved through faith.";
export function generationInput(lengthDays = 1, quickCheckEnabled = false): PlanGenerationInput {
  const transcriptSegments = [{ startMs: 0, endMs: 30_000, text: sourceQuote },
    { startMs: 30_000, endMs: 60_000, text: "Reflect on that love and respond faithfully today. " + scriptureReading }];
  return { sermon: { externalId: "5fVA7C24eI4", canonicalUrl: "https://www.youtube.com/watch?v=5fVA7C24eI4", title: "God's love", church: "Test", durationSeconds: 60 },
    transcriptSegments, transcript: formatTranscript(transcriptSegments), lengthDays, quickCheckEnabled };
}

/** The plan step: each day studies its own verse of the chapter the sermon names. */
export function outlineOutput(lengthDays = 1): OutlineOutput {
  return {
    title: "  God’s love  ",
    about: {
      overview: ["  This plan studies how God's love is shown in giving His Son.  "],
      keyTakeaways: ["God's love is demonstrated in giving His Son.", "Love calls for a faithful response today."],
      scripturesReferenced: [{ book: "John", chapter: 3, verseStart: 16, verseEnd: 16, reference: "John 3:16", evidenceQuote: sourceQuote }],
    },
    days: Array.from({ length: lengthDays }, (_, index) => ({
      dayNumber: index + 1,
      title: `Love, day ${index + 1}`,
      focus: `How God's love is shown, emphasis ${index + 1}.`,
      scripture: { book: "John", chapter: 3, verseStart: 16 + index, verseEnd: 16 + index, reference: `John 3:${16 + index}` },
    })),
  };
}

/** The day step for one day. */
export function dayOutput(dayNumber = 1): DayOutput {
  return {
    readingParagraphs: [{
      heading: "Love That Gives",
      content: `God's love is demonstrated in giving His Son. Study emphasis ${dayNumber}.`,
    }],
    sermonQuote: sourceQuote,
    clipStartSeconds: 0,
    clipEndSeconds: 30,
    reflections: [`How will you respond today, considering emphasis ${dayNumber}?`],
    prayer: { title: "Prayer", text: "Lord, help me respond to Your love. Amen." },
    supportingScriptures: [],
  };
}

export const QUICK_CHECK_QUESTIONS = 7;

export function sermonQuestion(dayNumber: number, question: number): QuizOutputQuestion {
  return {
    kind: "multipleChoice", source: "sermon",
    prompt: `In day ${dayNumber}, question ${question}: how was love demonstrated in this teaching?`,
    explanation: "The teaching points to God's giving His Son.", evidenceQuote: sourceQuote,
    choices: [{ text: "Giving His Son", correct: true }, { text: "Seeking praise", correct: false },
      { text: "Demanding wealth", correct: false }, { text: "Avoiding sacrifice", correct: false }],
    verse: null,
  };
}

/** Finish John 3:16, which reads differently in the BSB ("eternal life") and the KJV ("everlasting life"). */
export function finishTheVerseQuestion(): QuizOutputQuestion {
  return {
    kind: "finishTheVerse", source: "scripture", prompt: null, evidenceQuote: null, choices: null,
    explanation: "The verse ends with the life God gives to everyone who believes.",
    verse: {
      number: 16,
      BSB: { answer: "eternal life", distractors: ["a long life", "great reward", "earthly peace"] },
      KJV: { answer: "everlasting life", distractors: ["a long life", "great reward", "earthly peace"] },
    },
  };
}

/** The quiz step for one day: seven sermon questions. */
export function quizOutput(dayNumber = 1): QuizOutput {
  return {
    title: `Day ${dayNumber} Quick Check`,
    questions: Array.from({ length: QUICK_CHECK_QUESTIONS }, (_, index) => sermonQuestion(dayNumber, index + 1)),
  };
}

/**
 * A model that answers each step from these fixtures, or from `handlers`.
 * Each task names its day, so a handler can vary its answer by day.
 */
/** A step's task as the fake model reads it. */
export type FakeTask = { request?: { lengthDays: number }; day?: { dayNumber: number }; [field: string]: unknown };

export function fakeCaller(handlers: Partial<Record<StageKind, (task: FakeTask, call: number) => unknown>> = {}) {
  const calls: Array<{ kind: StageKind; stage: string }> = [];
  const requests: StageRequest[] = [];
  const caller: StageCaller = async (request) => {
    calls.push({ kind: request.kind, stage: request.stage });
    requests.push(request);
    const task = JSON.parse(request.task) as FakeTask;
    const count = calls.filter((call) => call.stage === request.stage).length;
    const handler = handlers[request.kind];
    const fallback = request.kind === "outline" ? outlineOutput(task.request?.lengthDays ?? 1)
      : request.kind === "day" ? dayOutput(task.day?.dayNumber ?? 1) : quizOutput(task.day?.dayNumber ?? 1);
    // A handler that returns nothing lets the fixture answer.
    const output = handler?.(task, count) ?? fallback;
    return {
      content: typeof output === "string" ? output : JSON.stringify(output),
      finishReason: "stop", refusal: null, model: "test-model",
      usage: { promptTokens: 100, cachedTokens: 64, completionTokens: 50, reasoningTokens: 10 },
    };
  };
  return { caller, calls, requests };
}

export const metadata = { version: "test-1", promptVersion: "test-1", provider: "openai", model: "test-model" };
export function testEnv(extra: NodeJS.ProcessEnv = {}) {
  return parseEnv({ NODE_ENV: "test", DATABASE_URL: "postgres://test:test@localhost/test", JWT_SECRET: "x".repeat(40),
    APP_ATTEST_TEAM_ID: "TEST", APP_ATTEST_BUNDLE_ID: "com.test.sundaybest", OPENAI_API_KEY: "test-key", ...extra });
}

/** Accepted steps kept in memory, as the worker keeps them in `generation_steps`. */
export function memoryCheckpoint() {
  const saved = new Map<string, unknown>();
  return { saved, load: async (key: string) => saved.get(key) ?? null, save: async (key: string, output: unknown) => { saved.set(key, output); } };
}
