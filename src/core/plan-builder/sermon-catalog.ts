import type { IsoDate, SermonSource, TranscriptStatus } from "@/types/domain";

import { MOCK_DATA } from "@/core/mock-data";

/** What looking up a sermon link finds: the video's details, before any plan is built. */
export type SermonPreview = {
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  thumbnailColors: string[];
  durationSeconds: number;
  publishedOn: IsoDate | null;
  transcriptStatus: TranscriptStatus;
};

/**
 * Links that always behave the same way, for trying the flow's edge cases
 * by hand or in tests. Any other valid link builds a plan.
 */
export const MOCK_TEST_LINKS = {
  /** No captions: the build stops while listening to the message. */
  noCaptions: "https://youtube.com/watch?v=nocaptions",
  /** Always fails while writing the days, however often it's retried. */
  buildFails: "https://youtube.com/watch?v=buildfail",
  /** Fails the first time, while finding the Scripture; the retry succeeds. */
  failsOnce: "https://youtube.com/watch?v=failonce",
} as const;

export function hasNoCaptions(url: string): boolean {
  return /nocaptions/i.test(url);
}

/** Sermons for links the mocks don't already know, picked by the link itself. */
const OTHER_SERMONS: readonly Pick<SermonPreview, "title" | "church" | "durationSeconds">[] = [
  { title: "Walking in the Light", church: "Cornerstone Church", durationSeconds: 2_460 },
  { title: "The God Who Sees", church: "Grace Street Fellowship", durationSeconds: 2_130 },
  { title: "Faithful in Little Things", church: "Riverside Chapel", durationSeconds: 1_985 },
  { title: "When You Pray", church: "Harbor Light Church", durationSeconds: 2_705 },
  {
    title: "A Harvest of Righteousness",
    church: "Northside Community Church",
    durationSeconds: 2_290,
  },
];

/** The last path or query segment of a link — its video ID on YouTube and Vimeo. */
function videoIdOf(url: string): string {
  return (
    url
      .split(/[/=?&]/)
      .filter(Boolean)
      .at(-1) ?? url
  );
}

/** A small, stable number from a string: the same link always lands the same way. */
function stableIndex(text: string, count: number): number {
  let total = 0;
  for (const character of text) total = (total * 31 + (character.codePointAt(0) ?? 0)) % 9_973;
  return total % count;
}

function toPreview(sermon: SermonSource): SermonPreview {
  return {
    title: sermon.title,
    church: sermon.church,
    thumbnailUrl: sermon.thumbnailUrl,
    thumbnailColors: sermon.thumbnailColors,
    durationSeconds: sermon.durationSeconds ?? 0,
    publishedOn: sermon.publishedOn,
    transcriptStatus: sermon.transcriptStatus,
  };
}

/**
 * The sermon behind a link, as a real lookup would find it — deterministic:
 * the same link always gives the same sermon. A link to one of the mock
 * sermons finds that sermon; the no-captions test link finds a sermon with
 * no transcript; anything else finds one of a handful of sermons.
 */
export function lookUpMockSermon(url: string): SermonPreview {
  const id = videoIdOf(url);
  const known = Object.values(MOCK_DATA.sermons).find((sermon) => videoIdOf(sermon.url) === id);
  if (known) return { ...toPreview(known), transcriptStatus: "available" };

  const other = OTHER_SERMONS.at(stableIndex(id, OTHER_SERMONS.length)) ?? OTHER_SERMONS[0];
  return {
    title: other?.title ?? "Sunday's Sermon",
    church: other?.church ?? null,
    thumbnailUrl: null,
    thumbnailColors: [],
    durationSeconds: other?.durationSeconds ?? 2_400,
    publishedOn: null,
    transcriptStatus: hasNoCaptions(url) ? "unavailable" : "available",
  };
}
