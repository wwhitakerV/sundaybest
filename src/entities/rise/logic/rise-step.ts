import { stepBalloons } from "./rise-balloons";
import { burstBalloon, clearMess, popBalloon, stepDamage } from "./rise-damage";
import { endStroke } from "./rise-paint";
import { MODE, OUTCOME, RISE, type RiseGame } from "./rise-rules";

/** The longest step taken at once: a dropped frame catches up without things leaping. */
const MOST_STEP_MS = 34;

/** The pair rising now, still able to be marked — or -1, between and after. */
export function activePair(game: RiseGame): number {
  "worklet";
  return game.pairs.findIndex(
    (pair) => game.time >= pair.start && game.time < pair.start + RISE.riseMs,
  );
}

/**
 * What a right answer keeps: the rest of its pair's rise after its final
 * mark, to the tenth — as the run keeps it, so what's shown always adds up.
 */
function kept(markedAt: number): number {
  "worklet";
  return RISE.riseMs - Math.round(markedAt / RISE.tenthMs) * RISE.tenthMs;
}

/**
 * A pair reaches the line, and its mark is final. The wrong one crossed out:
 * it pops, and the right one rises on into the atmosphere, saved. The right
 * one crossed out: the wrong one bursts in black, and the right one pops
 * too, without more paint. Nothing marked: both burst in black.
 */
function resolve(game: RiseGame, index: number): void {
  "worklet";
  const pair = game.pairs[index]!;
  const right = index * 2 + pair.right;
  const wrong = index * 2 + (pair.right === 0 ? 1 : 0);
  if (game.stroke.balloon === right || game.stroke.balloon === wrong) endStroke(game);
  if (pair.marked === game.balloons[wrong]!.side) {
    pair.outcome = OUTCOME.right;
    popBalloon(game, wrong, false);
    // From the lock it's a body like the saved: rising on through the line (`adrift`).
    game.balloons[right]!.mode = MODE.crossing;
    game.balloons[right]!.spin = 0;
    // What it kept, rising off it as it crosses: "+2.9s".
    game.gains.push(right, 0, game.time, kept(pair.markedAt));
    if (!pair.practice) game.score += 1;
  } else if (pair.marked === game.balloons[right]!.side) {
    pair.outcome = OUTCOME.wrong;
    burstBalloon(game, wrong);
    popBalloon(game, right, true);
  } else {
    pair.outcome = OUTCOME.missed;
    burstBalloon(game, wrong);
    burstBalloon(game, right);
  }
}

/** Starts the rise: the first pair sets off. */
export function startRise(game: RiseGame): void {
  "worklet";
  if (game.phase === "ready") game.phase = "play";
}

/**
 * One frame of RISE, `frameMs` long: pairs reaching the line resolved, the
 * practice's mess swept away when its time comes, the balloons and the mess
 * moved on — and, a beat after the last pair, it's over. Over, it carries on
 * moving: the saved keep floating, the last paint lands.
 */
export function advanceRise(game: RiseGame, frameMs: number): void {
  "worklet";
  if (game.phase === "ready") return;
  const dt = Math.min(MOST_STEP_MS, Math.max(0, frameMs));
  if (dt === 0) return;
  game.time += dt;
  game.pairs.forEach((pair, index) => {
    if (pair.outcome === OUTCOME.pending && game.time >= pair.start + RISE.riseMs) {
      resolve(game, index);
    }
  });
  if (game.clearAt >= 0 && game.time >= game.clearAt) {
    clearMess(game);
    game.clearAt = -1;
  }
  stepBalloons(game, dt);
  stepDamage(game, dt);
  if (game.gains.length > 0 && game.time - game.gains[2]! > RISE.gainMs) game.gains.splice(0, 4);
  const last = game.pairs.at(-1);
  if (game.phase === "play" && last && game.time >= last.start + RISE.riseMs + RISE.endMs) {
    game.phase = "over";
  }
}

/**
 * A day already played, played again from its marks — no paint, the same
 * pops and bursts — to where it ended: its finished screen, as it was left.
 */
export function replayRise(
  game: RiseGame,
  marks: { marked: number; markedAt: number }[],
): RiseGame {
  "worklet";
  game.pairs.forEach((pair, index) => {
    pair.marked = marks.at(index)?.marked ?? -1;
    pair.markedAt = marks.at(index)?.markedAt ?? RISE.riseMs;
  });
  startRise(game);
  while (game.phase === "play") advanceRise(game, 1000 / 60);
  return game;
}
