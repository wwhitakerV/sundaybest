import { endCall, stepCall } from "./flock-call";
import { clamp } from "./flock-geometry";
import { BOARD, COUNTDOWN_MS, GATE, STEP_MS, type FlockGame } from "./flock-rules";
import { stepSheep } from "./flock-sheep";
import { stepWolf } from "./flock-wolf";

/**
 * The 99, moving: the gate placed (dragged along the band's line, locked
 * where it's let go), the countdown, then play in fixed ticks — the call, the
 * flock, the wolf — until every sheep is saved or taken. Worklets, each after
 * what it calls.
 */

/** The most ticks one frame may catch up on, so a stall never fast-forwards the game. */
const MOST_STEPS = 5;

/** Slides the gate along the band's line while it's being placed. */
export function slideGate(game: FlockGame, x: number): void {
  "worklet";
  if (game.phase !== "gate") return;
  game.gateX = clamp(x, GATE.width / 2, BOARD.width - GATE.width / 2);
}

/** Locks the gate where it's let go, and starts the countdown. */
export function lockGate(game: FlockGame): void {
  "worklet";
  if (game.phase !== "gate") return;
  game.phase = "countdown";
  game.countdown = 0;
}

/** How far through the countdown, 0 to 1 — the wolf filling red. */
export function countdownShare(game: FlockGame): number {
  "worklet";
  if (game.phase === "gate") return 0;
  if (game.phase !== "countdown") return 1;
  return clamp(game.countdown / COUNTDOWN_MS, 0, 1);
}

/** One fixed tick of play: the call, the flock, the wolf — and whether every sheep is home or gone. */
function tick(game: FlockGame): void {
  "worklet";
  game.time += STEP_MS;
  stepCall(game);
  stepSheep(game);
  stepWolf(game);
  if (game.saved + game.taken >= game.sheep.length) {
    endCall(game);
    game.phase = "over";
  }
}

/** Advances the game by a frame's worth of time: the countdown, then play in fixed ticks. */
export function advance(game: FlockGame, frameMs: number): void {
  "worklet";
  if (game.phase === "countdown") {
    game.countdown += frameMs;
    if (game.countdown < COUNTDOWN_MS) return;
    game.phase = "play";
    game.carry = 0;
    return;
  }
  if (game.phase !== "play") return;
  game.carry += frameMs;
  let steps = 0;
  while (game.carry >= STEP_MS && steps < MOST_STEPS && game.phase === "play") {
    tick(game);
    game.carry -= STEP_MS;
    steps += 1;
  }
  if (steps === MOST_STEPS) game.carry = 0;
}
