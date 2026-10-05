import type { ApiSermonSummary } from "@/core/api/contracts";
import type { IsoDate, TranscriptStatus } from "@/types/domain";

/** The sermon metadata New Plan needs before generation starts. */
export type SermonPreview = {
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  thumbnailColors: string[];
  durationSeconds: number | null;
  publishedOn: IsoDate | null;
  transcriptStatus: TranscriptStatus;
};

/** A sermon returned by the real SundayBest search API. */
export type SermonSearchResult = {
  id: string;
  url: string;
  sermon: SermonPreview;
};

export function toSermonPreview(sermon: ApiSermonSummary): SermonPreview {
  return {
    title: sermon.title,
    church: sermon.church,
    thumbnailUrl: sermon.thumbnailUrl,
    thumbnailColors: sermon.thumbnailColors,
    durationSeconds: sermon.durationSeconds,
    publishedOn: sermon.publishedOn,
    transcriptStatus: sermon.transcriptStatus,
  };
}

export function toSermonSearchResult(sermon: ApiSermonSummary): SermonSearchResult {
  return {
    id: sermon.id,
    url: sermon.canonicalUrl,
    sermon: toSermonPreview(sermon),
  };
}
