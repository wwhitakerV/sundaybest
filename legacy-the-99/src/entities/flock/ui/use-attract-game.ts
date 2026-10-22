import { useEffect } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";

import { endCall, moveCall, startCall } from "../logic/flock-call";
import { BAND, SHEEP_STATE, type FlockGame } from "../logic/flock-rules";
import { advance } from "../logic/flock-step";

/** One time round the loop — the wolf's arrival, then the hunt — before the board starts again. */
const LOOP_MS = 14000;
/** The shepherd's rhythm: a short call, then a breath, again and again. */
const CALL_EVERY_MS = 1100;
const CALL_FOR_MS = 650;
/** How far ahead of the flock, toward the gate, it calls. */
const LEAD = 160;

/** Today's board with the gate where it starts: the wolf arriving, or — at rest — already hunting. */
function fromGate(board: FlockGame, phase: "countdown" | "play"): FlockGame {
  "worklet";
  const copy = JSON.parse(JSON.stringify(board)) as FlockGame;
  copy.phase = phase;
  return copy;
}

/** Where the shepherd calls: just ahead of the flock's middle, toward the gate. */
function leadPoint(game: FlockGame): { x: number; y: number } {
  "worklet";
  let x = 0;
  let y = 0;
  let count = 0;
  for (const sheep of game.sheep) {
    if (sheep.state !== SHEEP_STATE.field) continue;
    x += sheep.x;
    y += sheep.y;
    count += 1;
  }
  if (count === 0) return { x: game.gateX, y: BAND + LEAD };
  x /= count;
  y /= count;
  const dx = game.gateX - x;
  const dy = BAND - y;
  const away = Math.hypot(dx, dy) || 1;
  const step = Math.min(LEAD, away);
  return { x: x + (dx / away) * step, y: Math.max(BAND + 10, y + (dy / away) * step) };
}

/**
 * Today's board playing itself, for `FlockBoard` to draw on Home: the real
 * game — the wolf arriving, its 3, 2, 1 inside it, then a shepherd leading
 * the flock toward the gate in short calls as it hunts — starting again
 * every `LOOP_MS`. While `running`; else the board at rest, the wolf solid
 * (under Reduce Motion, or off screen).
 */
export function useAttractGame(board: FlockGame, running: boolean) {
  const game = useSharedValue(fromGate(board, "play"));
  const started = useSharedValue(0);
  const loop = useFrameCallback((frame) => {
    const now = frame.timeSinceFirstFrame;
    if (now - started.get() > LOOP_MS) {
      started.set(now);
      game.set(fromGate(board, "countdown"));
      return;
    }
    game.modify((value) => {
      "worklet";
      const beat = value.time % CALL_EVERY_MS;
      const point = leadPoint(value);
      if (beat < CALL_FOR_MS) {
        if (value.call.active) moveCall(value, point.x, point.y);
        else startCall(value, point.x, point.y);
      } else if (value.call.active) {
        endCall(value);
      }
      advance(value, frame.timeSincePreviousFrame ?? 0);
      return value;
    });
  }, false);

  useEffect(() => {
    loop.setActive(running);
    game.set(fromGate(board, running ? "countdown" : "play"));
  }, [running, loop, game, board]);

  return game;
}
