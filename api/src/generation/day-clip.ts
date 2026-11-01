import type { PlanGenerationInput } from "../providers/plan-generation-provider.js";
import { clipIsValid } from "./clip.js";
import type { Outline } from "./stages/outline.js";
import { hasTranscriptTiming, transcriptEndSeconds } from "./transcript.js";

export interface DayClip {
  clipStartSeconds: number | null;
  clipEndSeconds: number | null;
}

const NO_CLIP: DayClip = { clipStartSeconds: null, clipEndSeconds: null };

/**
 * Each day's part of the sermon in the video: from where its first point is
 * made to where the next day's first point is, the last day's to the end of
 * the sermon (the transcript's or the video's, whichever is sooner). Worked
 * out from the points, never asked of the model. None without timing, or for
 * a day none of whose points has a time.
 */
export function dayClips(outline: Outline, input: PlanGenerationInput): DayClip[] {
  const segments = input.transcriptSegments;
  const transcriptEnd = segments && hasTranscriptTiming(segments) ? transcriptEndSeconds(segments) : null;
  if (transcriptEnd === null) return outline.days.map(() => NO_CLIP);
  const sermonEnd = input.sermon.durationSeconds != null ? Math.min(transcriptEnd, Math.floor(input.sermon.durationSeconds)) : transcriptEnd;
  const startOf = new Map(outline.points.map((point) => [point.id, point.startSeconds]));
  const starts = outline.days.map((day) => {
    const times = day.pointIds.map((id) => startOf.get(id)).filter((time): time is number => time !== null && time !== undefined);
    return times.length > 0 ? Math.min(...times) : null;
  });
  return starts.map((start) => {
    if (start === null) return NO_CLIP;
    const later = starts.filter((other): other is number => other !== null && other > start);
    const end = later.length > 0 ? Math.min(...later) : sermonEnd;
    return clipIsValid(start, end, input) ? { clipStartSeconds: start, clipEndSeconds: end } : NO_CLIP;
  });
}
