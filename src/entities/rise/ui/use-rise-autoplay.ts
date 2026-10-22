import { useEffect, useMemo } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";

import { RISE_DEMO, RISE_DEMO_MARKS } from "../logic/rise-demo";
import { beginStroke, endStroke, moveStroke } from "../logic/rise-paint";
import { RISE, type RiseGame } from "../logic/rise-rules";
import { newRiseGame, riseStage } from "../logic/rise-setup";
import { activePair, advanceRise, replayRise, startRise } from "../logic/rise-step";

/** When, into each pair's rise, the preview's brush crosses its balloon out (ms). */
const STROKE = { from: 1300, to: 1900 };
/** How far across and up and down the brush zigzags, as shares of the balloon. */
const ZIGZAG = { across: 0.64, wave: 0.1, turns: 3 };
/** A rest on the finished board before it starts again. */
const REST_MS = 2500;

/** The demo, started. */
function freshDemo(width: number, height: number): RiseGame {
  "worklet";
  const game = newRiseGame(riseStage(width, height), RISE_DEMO);
  startRise(game);
  return game;
}

/** The demo as it ends, for the still board: what it would leave behind. */
function finishedDemo(width: number, height: number): RiseGame {
  "worklet";
  const marks = RISE_DEMO_MARKS.map((marked) => ({ marked, markedAt: STROKE.to }));
  return replayRise(newRiseGame(riseStage(width, height), RISE_DEMO), marks);
}

/** Where the preview's brush is on a balloon, `share` of the way across it. */
function brushAt(game: RiseGame, index: number, share: number): { x: number; y: number } {
  "worklet";
  const b = game.balloons[index]!;
  const { balloonW, balloonH } = game.stage;
  return {
    x: b.x + (share - 0.5) * ZIGZAG.across * balloonW * b.scale,
    y: b.y - balloonH * 0.05 + Math.sin(share * Math.PI * ZIGZAG.turns) * ZIGZAG.wave * balloonH,
  };
}

/**
 * Home's preview of RISE: the real game playing the demo pairs, a brush
 * crossing one of each pair out — a burst once, so it shows what's at
 * stake — then resting on what it left, and starting again. While
 * `running`; else the finished board, still (Reduce Motion, or off screen).
 */
export function useRiseAutoplay(width: number, height: number, running: boolean) {
  const still = useMemo(() => finishedDemo(width, height), [width, height]);
  const game = useSharedValue(still);
  const pen = useSharedValue(-1);
  const loop = useFrameCallback((frame) => {
    const value = game.get();
    const end = (RISE_DEMO.length - 1) * RISE.riseMs + RISE.riseMs + RISE.endMs + REST_MS;
    if (value.time > end) {
      game.set(freshDemo(width, height));
      pen.set(-1);
      return;
    }
    game.modify((current) => {
      "worklet";
      const index = activePair(current);
      const at = index >= 0 ? current.time - current.pairs[index]!.start : -1;
      const target = index * 2 + (RISE_DEMO_MARKS.at(index) ?? 0);
      if (index >= 0 && at >= STROKE.from && at < STROKE.to) {
        const point = brushAt(current, target, (at - STROKE.from) / (STROKE.to - STROKE.from));
        if (pen.get() !== index) {
          beginStroke(current, point.x, point.y);
          pen.set(index);
        } else {
          moveStroke(current, point.x, point.y);
        }
      } else if (pen.get() >= 0 && (index < 0 || at >= STROKE.to)) {
        endStroke(current);
        pen.set(-2);
      }
      advanceRise(current, frame.timeSincePreviousFrame ?? 0);
      return current;
    });
  }, false);

  useEffect(() => {
    loop.setActive(running);
    game.set(running ? freshDemo(width, height) : still);
    pen.set(-1);
  }, [running, loop, game, pen, still, width, height]);

  return game;
}
