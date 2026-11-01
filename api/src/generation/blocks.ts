import { transcriptBlocks, type TranscriptSegment } from "./transcript.js";

const blocksOf = new WeakMap<object, TranscriptSegment[]>();

/**
 * The block numbers in however a model writes them: "b45", "B45", "45",
 * "[b45 00:05:31]", or a run "b45-b47" (both ends, and those between). Times
 * are never taken for block numbers.
 */
export function blockNumbers(written: string): number[] {
  const bare = written.replace(/\d{1,2}:\d{2}(?::\d{2})?/g, " ");
  const run = /b?(\d+)\s*[-–]\s*b?(\d+)/i.exec(bare);
  if (run) {
    const [from, to] = [Number(run[1]), Number(run[2])];
    return to >= from && to - from < 3 ? Array.from({ length: to - from + 1 }, (_, offset) => from + offset) : [from];
  }
  const number = /b?(\d+)/i.exec(bare);
  return number ? [Number(number[1])] : [];
}

/** The sermon's numbered blocks as segments of their own, worked out once per transcript. */
export function sermonBlocks(transcript: string | readonly TranscriptSegment[]): TranscriptSegment[] {
  const key = typeof transcript === "string" ? new String(transcript) : transcript;
  if (typeof transcript !== "string" && blocksOf.has(key)) return blocksOf.get(key)!;
  const blocks = transcriptBlocks(transcript).map(({ startMs, endMs, text }) => ({ startMs, endMs, text }));
  if (typeof transcript !== "string") blocksOf.set(key, blocks);
  return blocks;
}
