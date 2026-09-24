import type { Entity, IsoDate } from "./common";

/** Where a sermon video is hosted. */
export type SermonPlatform = "youtube" | "vimeo" | "other";

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
};

/**
 * A stretch of the sermon — "Hear this part of the sermon". `endSeconds` is
 * null when it simply plays on from `startSeconds`.
 */
export type SermonClip = {
  startSeconds: number;
  endSeconds: number | null;
};
