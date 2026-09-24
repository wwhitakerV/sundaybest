import type { Entity, IsoDate } from "./common";

/** Where a sermon video is hosted. */
export type SermonPlatform = "youtube" | "vimeo" | "other";

/**
 * - `available` — a full transcript (or the uploader's captions) is in hand.
 * - `autoCaptions` — only the platform's automatic captions; good enough, rougher.
 * - `processing` — still being fetched.
 * - `unavailable` — none; a plan can't be built from it.
 */
export type TranscriptStatus = "available" | "autoCaptions" | "processing" | "unavailable";

/** One line of a sermon's transcript, and where in the video it's said. */
export type TranscriptSegment = {
  startSeconds: number;
  text: string;
};

/** The sermon a plan is built from: the video behind the pasted link. */
export type SermonSource = Entity & {
  /** The link as pasted. */
  url: string;
  platform: SermonPlatform;
  title: string;
  /** Who preached it, if known. */
  speaker: string | null;
  /** The church or channel it's from, if known. */
  church: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  publishedOn: IsoDate | null;
  transcriptStatus: TranscriptStatus;
  /** The transcript, in order; empty until it's in hand. */
  transcript: TranscriptSegment[];
};

/**
 * A stretch of the sermon — "Hear this part of the sermon". `endSeconds` is
 * null when it simply plays on from `startSeconds`.
 */
export type SermonClip = {
  startSeconds: number;
  endSeconds: number | null;
};
