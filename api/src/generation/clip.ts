import type { PlanGenerationInput } from "../providers/plan-generation-provider.js";
import { containsExcerpt, hasTranscriptTiming, transcriptEndSeconds } from "./transcript.js";

/**
 * Whether a clip can be published: the transcript has real timing, the clip
 * lies within the transcript and the video, and it contains its sermon quote.
 */
export function clipIsValid(start: number, end: number, sermonQuote: string | null, input: PlanGenerationInput): boolean {
  const segments = input.transcriptSegments;
  if (!segments || !hasTranscriptTiming(segments) || end <= start) return false;
  const bound = transcriptEndSeconds(segments);
  if (bound === null || end > bound || start >= bound) return false;
  if (input.sermon.durationSeconds != null && end > Math.ceil(input.sermon.durationSeconds)) return false;
  const excerpt = segments
    .filter((s) => s.startMs < end * 1000 && (s.endMs ?? s.startMs + 1) > start * 1000)
    .map((s) => s.text).join(" ").trim();
  return excerpt.length > 0 && (!sermonQuote || containsExcerpt(excerpt, sermonQuote));
}
