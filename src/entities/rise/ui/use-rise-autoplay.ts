import { useEffect, useMemo, useState } from "react";
import {
  runOnJS,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";

import { RISE_DEMO, RISE_DEMO_MARKS, RISE_DEMO_STROKES } from "../logic/rise-demo";
import { beginStroke, endStroke, moveStroke } from "../logic/rise-paint";
import { RISE, type RiseGame } from "../logic/rise-rules";
import { newRiseGame, riseStage } from "../logic/rise-setup";
import { bodyStretch } from "../logic/rise-shape";
import { activePair, advanceRise, replayRise, startRise } from "../logic/rise-step";

/** When, into each pair's rise, the preview starts its mark (ms): well up the board, in plain view. */
const MARK_FROM = 3200;
/**
 * How the pen moves — fast, as a finger makes a quick mark: ms for each share
 * of the balloon its stroke travels, the quick lift between strokes, and the
 * longest a whole mark takes (a scribble over the whole balloon is frantic,
 * not slow).
 */
const PEN = { msPerShare: 120, liftMs: 70, mostMs: 1100 };

/** One stroke of a mark, timed: its points, how far along it each is, and when it's drawn (ms into the rise). */
type TimedStroke = { points: readonly number[]; along: number[]; start: number; end: number };

/**
 * A mark's strokes, one after the other from `MARK_FROM`, each as long as it
 * takes the pen to travel it — all quicker, if the mark would take longer
 * than `PEN.mostMs`.
 */
function timeMark(strokes: readonly (readonly number[])[]): {
  strokes: TimedStroke[];
  end: number;
} {
  const measured = strokes.map((points) => {
    const along = [0];
    for (let i = 2; i < points.length; i += 2) {
      const step = Math.hypot(points[i]! - points[i - 2]!, points[i + 1]! - points[i - 1]!);
      along.push(along.at(-1)! + step);
    }
    return { points, along };
  });
  const lifts = (strokes.length - 1) * PEN.liftMs;
  const drawing = measured.reduce((sum, { along }) => sum + along.at(-1)! * PEN.msPerShare, 0);
  const pace = PEN.msPerShare * Math.min(1, (PEN.mostMs - lifts) / drawing);
  let at = MARK_FROM;
  const timed = measured.map(({ points, along }) => {
    const start = at;
    const end = start + along.at(-1)! * pace;
    at = end + PEN.liftMs;
    return { points, along, start, end };
  });
  return { strokes: timed, end: timed.at(-1)?.end ?? MARK_FROM };
}

/** Each demo pair's mark, timed. */
const MARKS = RISE_DEMO_STROKES.map(timeMark);
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
  const marks = RISE_DEMO_MARKS.map((marked, index) => ({
    marked,
    markedAt: MARKS[index]?.end ?? MARK_FROM,
  }));
  return replayRise(newRiseGame(riseStage(width, height), RISE_DEMO), marks);
}

/** Where on a stroke the pen is, `share` of the way along it: in the balloon's shares. */
function penOn(stroke: TimedStroke, share: number): { x: number; y: number } {
  "worklet";
  const { points, along } = stroke;
  const total = along.at(-1) ?? 0;
  const reach = Math.min(1, Math.max(0, share)) * total;
  let i = 1;
  while (i < along.length - 1 && along[i]! < reach) i += 1;
  const from = along[i - 1] ?? 0;
  const span = (along[i] ?? from) - from || 1;
  const t = Math.min(1, (reach - from) / span);
  return {
    x: points[(i - 1) * 2]! + (points[i * 2]! - points[(i - 1) * 2]!) * t,
    y: points[(i - 1) * 2 + 1]! + (points[i * 2 + 1]! - points[(i - 1) * 2 + 1]!) * t,
  };
}

/** The corners of a stroke the pen passed between `from` and `to` of the way along it: their points' indexes. */
function cornersBetween(stroke: TimedStroke, from: number, to: number): number[] {
  "worklet";
  const total = stroke.along.at(-1) ?? 0;
  const out: number[] = [];
  for (let i = 1; i < stroke.along.length - 1; i += 1) {
    const at = stroke.along[i]! / (total || 1);
    if (at > from && at <= to) out.push(i);
  }
  return out;
}

/** A point in a balloon's shares, on the screen where the balloon is: turned and sized as it's drawn. */
function onBalloon(game: RiseGame, index: number, at: { x: number; y: number }) {
  "worklet";
  const b = game.balloons[index]!;
  const stretch = bodyStretch(b);
  const lx = at.x * (game.stage.balloonW / 2) * stretch.x;
  const ly = at.y * (game.stage.balloonH / 2) * stretch.y;
  const cos = Math.cos(b.angle);
  const sin = Math.sin(b.angle);
  return { x: b.x + lx * cos - ly * sin, y: b.y + lx * sin + ly * cos };
}

/**
 * Home's preview of RISE: the real game playing the demo pairs, a pen
 * crossing one of each pair out, a different mark on each
 * (`RISE_DEMO_STROKES`) — the right one half the time, a burst, so it shows
 * what's at stake — then resting on what it left, and starting again. While
 * `running`; else the finished board, still (Reduce Motion, or off screen).
 * With it, the question of the pair rising now, as the game shows it — none
 * between pairs, or while it's still.
 */
export function useRiseAutoplay(width: number, height: number, running: boolean) {
  const still = useMemo(() => finishedDemo(width, height), [width, height]);
  const game = useSharedValue(still);
  const pen = useSharedValue(-1);
  // How far along the stroke it's drawn: the pen passes through every corner since.
  const drawn = useSharedValue(0);
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
      const strokes = index >= 0 ? (MARKS[index]?.strokes ?? []) : [];
      const drawing = strokes.findIndex((stroke) => at >= stroke.start && at < stroke.end);
      const stroke = strokes[drawing];
      if (stroke) {
        // Each stroke its own: the pen lifted between them, as a hand draws an X.
        const key = index * 100 + drawing;
        // A flick: quickening into the stroke, easing off at its end.
        const t = (at - stroke.start) / (stroke.end - stroke.start);
        const share = t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
        if (pen.get() !== key) {
          if (pen.get() >= 0) endStroke(current);
          const first = onBalloon(current, target, penOn(stroke, 0));
          beginStroke(current, first.x, first.y);
          pen.set(key);
          drawn.set(0);
        }
        // Every corner it passed this frame, then where it is: a zigzag keeps its corners at speed.
        for (const corner of cornersBetween(stroke, drawn.get(), share)) {
          const at = { x: stroke.points[corner * 2]!, y: stroke.points[corner * 2 + 1]! };
          const point = onBalloon(current, target, at);
          moveStroke(current, point.x, point.y);
        }
        const point = onBalloon(current, target, penOn(stroke, share));
        moveStroke(current, point.x, point.y);
        drawn.set(share);
      } else if (pen.get() >= 0) {
        endStroke(current);
        pen.set(-1);
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

  // The pair rising now: told to React only as it changes, never each frame.
  const [asked, setAsked] = useState(-1);
  useAnimatedReaction(
    () => (running ? activePair(game.get()) : -1),
    (now, before) => {
      if (now !== before) runOnJS(setAsked)(now);
    },
    [running],
  );

  return { game, question: asked >= 0 ? (RISE_DEMO[asked]?.question ?? null) : null };
}
