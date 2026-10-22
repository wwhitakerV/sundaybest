import { runOnJS, useAnimatedReaction, type SharedValue } from "react-native-reanimated";

import {
  burstFeedback,
  paintFeedback,
  popFeedback,
  selectionFeedback,
  successFeedback,
} from "@/core/haptics/haptics";
import { activePair, type RiseGame } from "@/entities/rise";

/** A finished board's marks, the practice left out: what's kept of the run. */
export type BoardMarks = { marked: number; markedAt: number }[];

/**
 * What the board tells the screen as it plays, from the UI thread: each
 * haptic as it happens — the brush landing, a mark made or moved, a clean
 * pop, a black burst, a balloon saved — which pair is rising now, and, once
 * it's over, its marks.
 */
export function useRiseReactions(
  game: SharedValue<RiseGame>,
  onPair: (index: number) => void,
  onOver: (marks: BoardMarks) => void,
  onError: (where: string, message: string) => void,
) {
  useAnimatedReaction(
    () => {
      const { events } = game.get();
      return [events.touches, events.marks, events.pops, events.bursts, events.saves];
    },
    (next, previous) => {
      if (previous === null) return;
      try {
        if (next[0]! > previous[0]!) runOnJS(paintFeedback)();
        if (next[1]! > previous[1]!) runOnJS(selectionFeedback)();
        if (next[2]! > previous[2]!) runOnJS(popFeedback)();
        if (next[3]! > previous[3]!) runOnJS(burstFeedback)();
        if (next[4]! > previous[4]!) runOnJS(successFeedback)();
      } catch (error) {
        runOnJS(onError)("haptics", String(error));
      }
    },
  );
  useAnimatedReaction(
    () => activePair(game.get()),
    (next, previous) => {
      if (next !== previous) runOnJS(onPair)(next);
    },
  );
  useAnimatedReaction(
    () => game.get().phase,
    (next, previous) => {
      if (previous !== "play" || next !== "over") return;
      try {
        const marks: BoardMarks = [];
        for (const pair of game.get().pairs) {
          if (!pair.practice) marks.push({ marked: pair.marked, markedAt: pair.markedAt });
        }
        runOnJS(onOver)(marks);
      } catch (error) {
        runOnJS(onError)("over", String(error));
      }
    },
  );
}
