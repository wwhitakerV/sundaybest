import { MOCK_DATA } from "@/core/mock-data";
import type { SermonPreview } from "@/core/plan-builder";

/** A sermon returned by the temporary frontend-only search catalogue. */
export type SermonSearchResult = {
  id: string;
  url: string;
  sermon: SermonPreview;
};

/**
 * Extra words that make the tiny mock catalogue useful to try by topic as
 * well as by the literal title/church. The real Supadata search replaces
 * this file; the screen and flow do not need to change.
 */
const SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "sermon-today-i-choose-to-be-a-blessing": ["joshua", "choose", "purpose", "blessing"],
  "sermon-break-the-cycle-of-negative-thinking": [
    "mind",
    "thoughts",
    "gratitude",
    "negative",
    "thinking",
  ],
  "sermon-still-praying": ["prayer", "pray", "faith", "waiting", "storm"],
  "sermon-the-church-must-not-partner-with-the-world": [
    "church",
    "world",
    "culture",
    "faithfulness",
  ],
};

function toPreview(sermon: (typeof MOCK_DATA.sermons)[string]): SermonPreview {
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
 * Frontend-only stand-in for YouTube search. It is async on purpose so the
 * hook already matches the real Supadata request shape later.
 */
export async function searchSermons(query: string): Promise<SermonSearchResult[]> {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) return [];

  return Object.values(MOCK_DATA.sermons)
    .filter((sermon) => sermon.platform === "youtube")
    .filter((sermon) => {
      const aliases = SEARCH_ALIASES[sermon.id] ?? [];
      const searchable = [sermon.title, sermon.church ?? "", ...aliases]
        .join(" ")
        .toLocaleLowerCase();
      return terms.every((term) => searchable.includes(term));
    })
    .map((sermon) => ({ id: sermon.id, url: sermon.url, sermon: toPreview(sermon) }));
}
