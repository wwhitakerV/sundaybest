import { AppError } from "../http/errors.js";

export interface TranscriptSegment {
  startMs: number;
  endMs: number | null;
  text: string;
}

export function normalizeSourceText(value: string): string {
  return value.normalize("NFKC").toLowerCase()
    .replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'")
    .replace(/\s+/g, " ").trim();
}

export function normalizeTranscript(segments: readonly TranscriptSegment[]): TranscriptSegment[] {
  if (segments.some((s) => !Number.isSafeInteger(s.startMs) || s.startMs < 0 ||
    (s.endMs !== null && (!Number.isSafeInteger(s.endMs) || s.endMs < s.startMs)))) {
    throw new AppError("TRANSCRIPT_UNAVAILABLE", "Transcript contains invalid timestamps");
  }
  const normalized = segments.map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ").trim() }))
    .filter((s) => s.text.length > 0).sort((a, b) => a.startMs - b.startMs);
  if (normalized.length === 0) throw new AppError("TRANSCRIPT_UNAVAILABLE", "Transcript is empty");
  return normalized;
}

/** A plain-text provider response has no usable timing; never invent a clip. */
export function hasTranscriptTiming(segments: readonly TranscriptSegment[]): boolean {
  return segments.some((s) => s.startMs > 0 || (s.endMs !== null && s.endMs > s.startMs));
}

export function transcriptEndSeconds(segments: readonly TranscriptSegment[]): number | null {
  if (!hasTranscriptTiming(segments)) return null;
  return Math.ceil(segments.reduce((end, s) => Math.max(end, s.endMs ?? s.startMs), 0) / 1000);
}

function timestamp(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((n) => String(n).padStart(2, "0")).join(":");
}

/** Ported from SermonDrop: 30-second blocks retain the source start timestamps. */
export function formatTranscript(input: readonly TranscriptSegment[]): string {
  const segments = normalizeTranscript(input);
  if (!hasTranscriptTiming(segments)) return `[TIMING UNAVAILABLE] ${segments.map((s) => s.text).join(" ")}`;
  const blocks: string[] = [];
  let start = segments[0]!.startMs;
  let end = start;
  let text: string[] = [];
  const flush = () => blocks.push(`[${timestamp(start)}–${timestamp(end)}] ${text.join(" ")}`);
  for (const segment of segments) {
    if (segment.startMs - start >= 30_000 && text.length > 0) {
      flush();
      start = segment.startMs;
      end = start;
      text = [];
    }
    end = Math.max(end, segment.startMs, segment.endMs ?? segment.startMs);
    text.push(segment.text);
  }
  if (text.length > 0) flush();
  return blocks.join("\n\n");
}
