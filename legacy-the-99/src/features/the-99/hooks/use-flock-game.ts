import { useEffect, useMemo, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";

import {
  callFeedback,
  lockFeedback,
  selectionFeedback,
  successFeedback,
  tapFeedback,
  warningFeedback,
} from "@/core/haptics/haptics";
import { hasDevMenu } from "@/core/dev-menu/dev-menu";
import { openShareSheet } from "@/core/sharing/share-sheet";
import { useGameResults } from "@/core/storage/game-result-queries";
import { useToday } from "@/core/store";
import {
  BOARD,
  SHEEP,
  advance,
  currentStrength,
  dailyBoard,
  dailyNumber,
  endCall,
  formatDaily,
  lockGate,
  moveCall,
  slideGate,
  startCall,
  type FlockGame,
} from "@/entities/flock";
import { describeResult } from "../logic/game-result";

type Phase = FlockGame["phase"];

/**
 * Today's game of The 99, played: the board for today's date, the same for
 * everyone. A drag along the band's line places the gate, locked where it's
 * let go; the countdown runs inside the wolf; then a touch in the field calls the flock — a
 * tap a small call, a hold one that grows, its haptic pulses quickening and
 * firming as it does. Stepped on the UI thread (`advance`). It ends when
 * every sheep is saved or taken: the count is kept on the phone,
 * once a day — a day already played shows its result.
 */
export function useFlockGame(boardWidth: number) {
  const today = useToday();
  const daily = dailyNumber(today);
  const board = useMemo(() => dailyBoard(daily), [daily]);
  const game = useSharedValue<FlockGame>(board);
  const { results, record, forget } = useGameResults("the-99");
  const played = results?.find((result) => result.daily === daily) ?? null;
  const yesterday = results?.find((result) => result.daily === daily - 1) ?? null;
  const [phase, setPhase] = useState<Phase>("gate");
  const [tally, setTally] = useState({ saved: 0, taken: 0 });
  const scale = boardWidth / BOARD.width;
  const done = played !== null || phase === "over";

  const loop = useFrameCallback((frame) => {
    game.modify((value) => {
      "worklet";
      advance(value, frame.timeSincePreviousFrame ?? 0);
      return value;
    });
  }, false);
  useEffect(() => {
    loop.setActive(phase === "countdown" || phase === "play");
  }, [phase, loop]);

  function onPhase(next: Phase, saved: number, timeMs: number) {
    setPhase(next);
    if (next === "play") tapFeedback();
    if (next !== "over") return;
    if (saved === board.sheep.length) successFeedback();
    else selectionFeedback();
    record({ daily, saved, survivedMs: timeMs });
  }
  useAnimatedReaction(
    () => game.get().phase,
    (next, previous) => {
      const now = game.get();
      if (previous !== null && next !== previous) runOnJS(onPhase)(next, now.saved, now.time);
    },
  );
  // The countdown's 3, 2, 1, drawn inside the wolf — each a light tick.
  useAnimatedReaction(
    () => Math.floor(game.get().countdown / 1000),
    (next, previous) => {
      if (game.get().phase === "countdown" && next !== previous) runOnJS(selectionFeedback)();
    },
  );
  useAnimatedReaction(
    () => game.get().saved * 1000 + game.get().taken,
    (next, previous) => {
      if (next === previous) return;
      const now = game.get();
      runOnJS(setTally)({ saved: now.saved, taken: now.taken });
      if (previous !== null && now.taken > previous % 1000) runOnJS(warningFeedback)();
    },
  );
  // A pulse with every wave of the call, harder as it grows; a double tap when the wolf locks on.
  useAnimatedReaction(
    () => game.get().pulses,
    (next, previous) => {
      if (previous !== null && next > previous) runOnJS(callFeedback)(currentStrength(game.get()));
    },
  );
  useAnimatedReaction(
    () => game.get().locks,
    (next, previous) => {
      if (previous !== null && next > previous) runOnJS(lockFeedback)();
    },
  );

  // One touch on the board: before play, sliding the gate (let go, it locks); in play, a call.
  const touch = Gesture.Pan()
    .enabled(!done)
    .minDistance(0)
    .onBegin((event) => {
      game.modify((value) => {
        "worklet";
        if (value.phase === "gate") slideGate(value, event.x / scale);
        else startCall(value, event.x / scale, event.y / scale);
        return value;
      });
    })
    .onUpdate((event) => {
      game.modify((value) => {
        "worklet";
        if (value.phase === "gate") slideGate(value, event.x / scale);
        else moveCall(value, event.x / scale, event.y / scale);
        return value;
      });
    })
    .onFinalize(() => {
      game.modify((value) => {
        "worklet";
        if (value.phase === "gate") lockGate(value);
        else endCall(value);
        return value;
      });
    });

  const saved = played?.saved ?? tally.saved;
  const lost = played ? SHEEP.count - (played.saved ?? 0) : tally.taken;
  const result =
    played !== null || phase === "over"
      ? describeResult({
          saved: played?.saved ?? tally.saved,
          yesterdaySaved: yesterday?.saved ?? null,
          daily: formatDaily(daily),
        })
      : null;

  return {
    daily: formatDaily(daily),
    game,
    touch,
    /** The gate to place, the countdown, play, or over — over, too, once today's been played. */
    phase: played ? ("over" as const) : phase,
    saved,
    lost,
    /** Still in the field, neither saved nor taken. */
    left: SHEEP.count - saved - lost,
    result,
    share: () => {
      if (result) void openShareSheet({ message: result.share });
    },
    /**
     * Development builds only: forgets today's run and puts today's flock back
     * where it started, gate to place — to play it again as often as wanted.
     */
    restart: hasDevMenu()
      ? async () => {
          await forget(daily);
          game.set(dailyBoard(daily));
          setPhase("gate");
          setTally({ saved: 0, taken: 0 });
        }
      : null,
  };
}
