import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { useIsFocused, useRouter } from "expo-router";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { tapFeedback } from "@/core/haptics/haptics";
import { logger } from "@/core/monitoring/logger";
import { useGameResults } from "@/core/storage/game-result-queries";
import { formatRiseDay, formatSpare, riseDayNumber, useRiseAutoplay } from "@/entities/rise";
import { PAGE_INSET } from "@/ui/organisms/Screen";

/** The preview's height: as tall as it's wide — room for balloons to rise, and for the saved to drift above the line. */
const PREVIEW_SHARE = 1;

/**
 * Home's Daily game section: RISE's preview, playing its demo pairs while
 * it's `shown` and Home's in view (not under Reduce Motion); today's
 * number; today's score, once played; and opening the game.
 */
export function useDailyRise(shown: boolean) {
  const router = useRouter();
  const isFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const { width: windowWidth } = useWindowDimensions();
  const [day] = useState(() => riseDayNumber(Date.now()));
  const { results } = useGameResults("rise");
  const played = results?.find((result) => result.daily === day) ?? null;
  const width = windowWidth - PAGE_INSET * 2;
  const height = Math.round(width * PREVIEW_SHARE);
  const { game, question } = useRiseAutoplay(width, height, shown && isFocused && !reduceMotion);

  return {
    day: formatRiseDay(day),
    game,
    /** The demo pair's question, on its line as the game shows it — none between pairs. */
    question,
    width,
    height,
    /** Today's score and time to spare, in a line, once played. */
    played: played
      ? `Today ${played.saved ?? 0} of 6, ${formatSpare(played.survivedMs)} to spare. A new six tomorrow.`
      : null,
    /** The preview's board failed on the UI thread: it stops, and says so — never silently. */
    onBoardError: (where: string, message: string) =>
      logger.error("RISE preview: the board failed", { where, message }),
    onOpen: () => {
      tapFeedback();
      router.push("/rise");
    },
  };
}
