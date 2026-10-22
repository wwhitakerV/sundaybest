import { useState } from "react";
import type { SharedValue } from "react-native-reanimated";

import { openShareSheet } from "@/core/sharing/share-sheet";
import { useRisePoster, type PosterFormat, type RiseGame } from "@/entities/rise";

/** Both posters of the board, once drawn: base64 PNGs, or null where one couldn't be. */
export type RisePosters = Record<PosterFormat, string | null>;

/**
 * Sharing a finished run: Share opens the sheet at once, and the board as it
 * stands that moment is drawn as both posters (`useRisePoster`) a frame
 * later, so the sheet never waits on them. A poster picked goes to iOS's
 * share sheet with its line — nothing leaves the phone until then.
 */
export function useRiseShare(
  game: SharedValue<RiseGame>,
  words: { share: string; poster: { score: string; time: string; label: string[] } } | null,
) {
  const makePoster = useRisePoster();
  const [open, setOpen] = useState(false);
  const [posters, setPosters] = useState<RisePosters | null>(null);

  return {
    open,
    posters,
    start: () => {
      if (!words) return;
      setPosters(null);
      setOpen(true);
      requestAnimationFrame(() => {
        const board = game.get();
        setPosters({
          post: makePoster(board, "post", words.poster),
          story: makePoster(board, "story", words.poster),
        });
      });
    },
    pick: (format: PosterFormat) => {
      const png = posters?.[format];
      if (words && png) void openShareSheet({ message: words.share, png });
    },
    close: () => setOpen(false),
  };
}
