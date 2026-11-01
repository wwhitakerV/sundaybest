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

/** Words only: lowercase, no punctuation. Captions are rarely punctuated as a model would quote them. */
function matchText(value: string): string {
  return normalizeSourceText(value).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

/**
 * Whether `excerpt` appears in `text` word for word and in order, ignoring case
 * and punctuation. Whole words only: "loved the world" does not match "worlds".
 */
export function containsExcerpt(text: string, excerpt: string): boolean {
  const needle = matchText(excerpt);
  return needle.length > 0 && ` ${matchText(text)} `.includes(` ${needle} `);
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

/** About how much of the sermon a block holds: a sentence or two, so a model can point at one. */
const BLOCK = { words: 28, ms: 12_000 };

/** A short, numbered stretch of the sermon ("b12"): where it starts and ends, and what's said. */
export interface TranscriptBlock {
  id: string;
  startMs: number;
  endMs: number | null;
  text: string;
}

/**
 * The sermon in short numbered blocks, about a sentence or two each — whole
 * caption segments grouped until a block holds about 28 words or 12 seconds;
 * an untimed transcript split by words alone. Models point at these by
 * number, and the words come from here, so what's shown is always said.
 */
export function transcriptBlocks(input: string | readonly TranscriptSegment[]): TranscriptBlock[] {
  const segments = typeof input === "string" ? [{ startMs: 0, endMs: null, text: input.replace(/\s+/g, " ").trim() }] : normalizeTranscript(input);
  const blocks: Array<Omit<TranscriptBlock, "id">> = [];
  if (!hasTranscriptTiming(segments)) {
    const words = segments.map((segment) => segment.text).join(" ").split(" ").filter(Boolean);
    for (let at = 0; at < words.length; at += BLOCK.words) blocks.push({ startMs: 0, endMs: null, text: words.slice(at, at + BLOCK.words).join(" ") });
  } else {
    let current: Omit<TranscriptBlock, "id"> | null = null;
    for (const segment of segments) {
      const words = current ? current.text.split(" ").length : 0;
      if (!current || words >= BLOCK.words || segment.startMs - current.startMs >= BLOCK.ms) {
        if (current) blocks.push(current);
        current = { startMs: segment.startMs, endMs: segment.endMs, text: segment.text };
      } else {
        current = { startMs: current.startMs, endMs: segment.endMs ?? current.endMs, text: `${current.text} ${segment.text}` };
      }
    }
    if (current) blocks.push(current);
  }
  return blocks.map((block, index) => ({ id: `b${index + 1}`, ...block }));
}

/**
 * The transcript as every step reads it: its numbered blocks, each with the
 * second it starts at (`[b12 00:05:31] …`), or numbered alone when the
 * transcript has no timing.
 */
export function formatTranscript(input: readonly TranscriptSegment[]): string {
  const segments = normalizeTranscript(input);
  const timed = hasTranscriptTiming(segments);
  const blocks = transcriptBlocks(segments).map((block) => `[${block.id}${timed ? ` ${timestamp(block.startMs)}` : ""}] ${block.text}`);
  return (timed ? "" : "[TIMING UNAVAILABLE]\n\n") + blocks.join("\n\n");
}
