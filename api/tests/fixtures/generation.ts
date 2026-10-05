import type { PlanGenerationInput } from "../../src/providers/plan-generation-provider.js";
import type { GenerationOutput } from "../../src/generation/output-schema.js";
import { formatTranscript } from "../../src/generation/transcript.js";
import { parseEnv } from "../../src/config/env-schema.js";

export const sourceQuote = "Turn to John chapter three verse sixteen. God loved the world and gave His Son.";
export function generationInput(lengthDays = 1, quickCheckEnabled = false): PlanGenerationInput {
  const transcriptSegments = [{ startMs: 0, endMs: 30_000, text: sourceQuote },
    { startMs: 30_000, endMs: 60_000, text: "Reflect on that love and respond faithfully today." }];
  return { sermon: { externalId: "5fVA7C24eI4", canonicalUrl: "https://www.youtube.com/watch?v=5fVA7C24eI4", title: "God's love", church: "Test", durationSeconds: 60 },
    transcriptSegments, transcript: formatTranscript(transcriptSegments), lengthDays, quickCheckEnabled };
}
export function generationOutput(lengthDays = 1, quickCheckEnabled = false): GenerationOutput {
  return { title: "  God’s love  ", days: Array.from({ length: lengthDays }, (_, index) => ({
    dayNumber: index + 1,
    readingTitle: `Love, day ${index + 1}`,
    readingParagraphs: [`God's love is demonstrated in giving His Son. Study emphasis ${index + 1}.`],
    sermonQuote: sourceQuote,
    clipStartSeconds: 0,
    clipEndSeconds: 30,
    scripture: { book: "John", chapter: 3, verseStart: 16, verseEnd: 16, reference: "John 3:16", evidenceQuote: sourceQuote },
    reflections: [`How will you respond today, considering emphasis ${index + 1}?`],
    prayer: { title: "Prayer", text: "Lord, help me respond to Your love. Amen." },
    quickCheck: quickCheckEnabled ? { title: `Day ${index + 1} Quick Check`, questions: [{ kind: "multipleChoice", source: "sermon",
      prompt: `In day ${index + 1}, how was love demonstrated in this teaching?`, scriptureReference: null,
      explanation: "The teaching points to God's giving His Son.", evidenceQuote: sourceQuote,
      choices: [{ label: "x", text: "Giving His Son", correct: true }, { label: "y", text: "Seeking praise", correct: false },
        { label: "z", text: "Demanding wealth", correct: false }, { label: "w", text: "Avoiding sacrifice", correct: false }] }] } : null,
  })) };
}
export const metadata = { version: "test-1", promptVersion: "test-1", provider: "openai", model: "test-model" };
export function testEnv(extra: NodeJS.ProcessEnv = {}) {
  return parseEnv({ NODE_ENV: "test", DATABASE_URL: "postgres://test:test@localhost/test", JWT_SECRET: "x".repeat(40),
    APP_ATTEST_TEAM_ID: "TEST", APP_ATTEST_BUNDLE_ID: "com.test.sundaybest", OPENAI_API_KEY: "test-key", ...extra });
}
