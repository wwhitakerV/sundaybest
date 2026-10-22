import { useMemo } from "react";
import { useIsFocused, useRouter } from "expo-router";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { tapFeedback } from "@/core/haptics/haptics";
import { useGameResults } from "@/core/storage/game-result-queries";
import { useToday } from "@/core/store";
import {
  SHEEP,
  dailyBoard,
  dailyNumber,
  formatDaily,
  useAttractGame,
} from "@/entities/flock";

/**
 * Home's Daily game section: today's board, playing itself while it's `shown`
 * and Home's in view (not under Reduce Motion, nor once today's been played); today's
 * number; how today's run went, once played; and opening the game.
 */
export function useDailyGame(shown: boolean) {
  const router = useRouter();
  const isFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const today = useToday();
  const daily = dailyNumber(today);
  const board = useMemo(() => dailyBoard(daily), [daily]);
  const { results } = useGameResults("the-99");
  const played = results?.find((result) => result.daily === daily) ?? null;
  const game = useAttractGame(board, shown && isFocused && !reduceMotion && played === null);

  return {
    daily: formatDaily(daily),
    game,
    /** Today's run, in a line, once played. */
    played: played
      ? `Today ${played.saved ?? 0} of ${SHEEP.count} saved. A new flock tomorrow.`
      : null,
    onOpen: () => {
      tapFeedback();
      router.push("/the-99");
    },
  };
}
