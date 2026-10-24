import { useEffect } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useFrameCallback, useSharedValue } from "react-native-reanimated";

import type { RiseGame } from "../logic/rise-rules";
import {
  dragDrifter,
  drifterGame,
  holdDrifter,
  releaseDrifter,
  settleDrifter,
  stepDrifter,
  touchesDrifter,
} from "./drifter";

/** A frame's step, at most: a stall catches up without the balloon leaping. */
const MOST_STEP_MS = 34;

export type RiseDrifterOptions = {
  /** How the question went: it rose — a saved balloon, green — or it burst, red and then paint. */
  verdict: "rose" | "burst";
  /** What's on the balloon: the answer — and, beneath it, the time it kept ("+1.5s"). */
  label: string;
  note: string | null;
  /** The page it's drawn on — none until it's laid out. */
  size: { width: number; height: number } | null;
  /** Reduce Motion: no drift and no fling; it still goes where a finger puts it. */
  still: boolean;
  /** The pager it's on: held, the balloon keeps the page from turning. */
  pager?: ReturnType<typeof Gesture.Native>;
  /** Told as it bursts, as a finger takes hold, and as a touch stops it dead: for their haptics. */
  onBurst?: () => void;
  onGrab?: () => void;
  onStop?: () => void;
};

/**
 * A page's balloon, alive and in reach: the game it lives in, stepped each
 * frame — adrift, and for one that burst, bursting on time, in a hand or not
 * — and the touch that plays with it. A touch on its body takes hold (the
 * page can't turn while it's held): it follows the finger, its string
 * trailing; let go, it flies at the finger's speed and ricochets off the
 * page's edges, or — barely moving, a tap — stops dead a beat, then drifts on.
 */
export function useRiseDrifter({
  verdict,
  label,
  note,
  size,
  still,
  pager,
  onBurst,
  onGrab,
  onStop,
}: RiseDrifterOptions) {
  const rose = verdict === "rose";
  const game = useSharedValue<RiseGame | null>(null);
  const ms = useSharedValue(0);
  const width = size?.width ?? 0;
  const height = size?.height ?? 0;

  // Laid out, the page's game is made for its size — a still page's burst already landed.
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const made = drifterGame(width, height, label, note);
    if (still) settleDrifter(made, rose);
    game.set(made);
    ms.set(0);
  }, [width, height, label, note, still, rose, game, ms]);

  useFrameCallback((frame) => {
    if (!game.get()) return;
    const step = Math.min(MOST_STEP_MS, frame.timeSincePreviousFrame ?? 0);
    ms.set(ms.get() + step);
    game.modify((value) => {
      "worklet";
      if (value && stepDrifter(value, rose, ms.get(), step) && onBurst) runOnJS(onBurst)();
      return value;
    });
  }, !still);

  const touch = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((event, state) => {
      const at = event.changedTouches[0];
      const value = game.get();
      if (at && value && touchesDrifter(value, at.x, at.y)) state.activate();
      else state.fail();
    })
    .onStart((event) => {
      game.modify((value) => {
        "worklet";
        if (value) holdDrifter(value, event.x, event.y);
        return value;
      });
      if (onGrab) runOnJS(onGrab)();
    })
    .onUpdate((event) => {
      game.modify((value) => {
        "worklet";
        if (value)
          dragDrifter(value, event.x, event.y, event.velocityX / 1000, event.velocityY / 1000);
        return value;
      });
    })
    .onFinalize((event) => {
      const flung = still ? 0 : 1;
      game.modify((value) => {
        "worklet";
        const stopped =
          value !== null &&
          releaseDrifter(value, (event.velocityX / 1000) * flung, (event.velocityY / 1000) * flung);
        if (stopped && onStop) runOnJS(onStop)();
        return value;
      });
    });
  if (pager) touch.blocksExternalGesture(pager);

  return { game, touch };
}
