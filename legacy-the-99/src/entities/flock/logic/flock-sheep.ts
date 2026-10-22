import { callReach, currentStrength } from "./flock-call";
import { clamp, mix, nextRandom } from "./flock-geometry";
import { BAND, BOARD, GATE, SHEEP, SHEEP_STATE, type FlockGame } from "./flock-rules";

/**
 * The flock: each sheep hops in small steps on its own beat, its way a blend
 * of its nature — drawn to the gate, wandering, following others — of any
 * call that reaches it, and of the wolf, when it's near. Through the gate it's
 * saved, into the band. Worklets, each after what it calls.
 */

/** The band's places for the saved: rows of this many, this far apart, filling up from the gate's line. */
const SLOT = { perRow: 10, apart: 70, fromLine: 60 };
/** How much each pull counts in a hop's way. */
const PULL = { gate: 0.16, wander: 0.9, follow: 0.5, call: 3.2, flee: 3 };
/** Near the gate, a sheep sees it open and makes for it: within this far, its pull grows up to this many times. */
const GATE_SEEN = { within: 260, times: 6 };
/** How near two sheep stand before they step apart. */
const ROOM = 26;
/** How likely an unhurried sheep is to stop and graze, at most. */
const GRAZE = 0.35;

/** A game's next random number, in [0, 1): it moves the game's seed on. */
function random(game: FlockGame): number {
  "worklet";
  const { value, state } = nextRandom(game.seed);
  game.seed = state;
  return value;
}

/** Where the `index`th saved sheep stands in the band: rows centred over the gate's line, filling upward. */
function savedSlot(index: number): { x: number; y: number } {
  "worklet";
  const row = Math.floor(index / SLOT.perRow);
  const column = index % SLOT.perRow;
  return {
    x: BOARD.width / 2 + (column - (SLOT.perRow - 1) / 2) * SLOT.apart,
    y: BAND - SLOT.fromLine - row * SLOT.apart,
  };
}

/** A direction, made one long — or nothing, when there's none. */
function unit(x: number, y: number): { x: number; y: number } {
  "worklet";
  const length = Math.hypot(x, y);
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

/** Toward the sheep around it, and away from any standing too close. */
function towardOthers(game: FlockGame, index: number): { x: number; y: number } {
  "worklet";
  const sheep = game.sheep[index]!;
  let sx = 0;
  let sy = 0;
  let near = 0;
  let px = 0;
  let py = 0;
  for (let j = 0; j < game.sheep.length; j += 1) {
    const other = game.sheep[j]!;
    if (j === index || other.state !== SHEEP_STATE.field) continue;
    const dx = other.x - sheep.x;
    const dy = other.y - sheep.y;
    if (dx > SHEEP.followWithin || dx < -SHEEP.followWithin) continue;
    if (dy > SHEEP.followWithin || dy < -SHEEP.followWithin) continue;
    const gap = Math.hypot(dx, dy);
    if (gap < ROOM && gap > 0) {
      px -= dx / gap;
      py -= dy / gap;
    }
    sx += dx;
    sy += dy;
    near += 1;
  }
  const toward = near > 0 ? unit(sx, sy) : { x: 0, y: 0 };
  return { x: toward.x + px, y: toward.y + py };
}

/** How long a sheep waits between hops, by its own speed. */
function hopGap(speed: number): number {
  "worklet";
  return mix(SHEEP.hopEvery.most, SHEEP.hopEvery.least, (speed - 0.6) / 0.8);
}

/** Through the gate: out of the field, and into the next place in the band. */
function save(game: FlockGame, index: number): void {
  "worklet";
  const sheep = game.sheep[index]!;
  const place = savedSlot(game.saved);
  sheep.state = SHEEP_STATE.saved;
  sheep.slot = game.saved;
  sheep.x = place.x;
  sheep.y = place.y;
  game.saved += 1;
}

/** One sheep's hop: its way from everything pulling at it, and how soon it hops again. */
function hop(game: FlockGame, index: number): void {
  "worklet";
  const sheep = game.sheep[index]!;
  const gate = unit(game.gateX - sheep.x, BAND - sheep.y);
  const fromGate = Math.hypot(game.gateX - sheep.x, BAND - sheep.y);
  const seen = 1 + (GATE_SEEN.times - 1) * clamp(1 - fromGate / GATE_SEEN.within, 0, 1);
  const angle = random(game) * Math.PI * 2;
  const others = towardOthers(game, index);
  let wx =
    gate.x * sheep.drift * PULL.gate * seen + Math.cos(angle) * sheep.independence * PULL.wander;
  let wy =
    gate.y * sheep.drift * PULL.gate * seen + Math.sin(angle) * sheep.independence * PULL.wander;
  wx += others.x * (1 - sheep.independence) * PULL.follow;
  wy += others.y * (1 - sheep.independence) * PULL.follow;
  let urgency = 1;
  const strength = currentStrength(game);
  if (strength > 0) {
    const reach = callReach(strength);
    const fromCall = Math.hypot(game.call.x - sheep.x, game.call.y - sheep.y);
    if (fromCall < reach) {
      // Nearer the call, the stronger its pull and the quicker the answer.
      const pull = strength * (1 - fromCall / reach);
      const toward = unit(game.call.x - sheep.x, game.call.y - sheep.y);
      wx += toward.x * PULL.call * pull;
      wy += toward.y * PULL.call * pull;
      urgency += 2 * pull;
    }
  }
  const fromWolf = Math.hypot(game.wolf.x - sheep.x, game.wolf.y - sheep.y);
  if (game.phase === "play" && fromWolf < SHEEP.fleeWithin) {
    const away = unit(sheep.x - game.wolf.x, sheep.y - game.wolf.y);
    const fear = 1 - fromWolf / SHEEP.fleeWithin;
    wx += away.x * PULL.flee * fear;
    wy += away.y * PULL.flee * fear;
    urgency += fear;
  }
  const grazing = urgency === 1 && random(game) < GRAZE * (1 - sheep.drift);
  if (!grazing) {
    const way = unit(wx, wy);
    const length = SHEEP.hop * sheep.speed * Math.min(2.2, urgency);
    const nx = sheep.x + way.x * length;
    const ny = sheep.y + way.y * length;
    const throughGate =
      ny <= BAND + SHEEP.radius && Math.abs(nx - game.gateX) < GATE.width / 2 - SHEEP.radius;
    if (throughGate) {
      save(game, index);
      return;
    }
    sheep.x = clamp(nx, SHEEP.radius, BOARD.width - SHEEP.radius);
    sheep.y = clamp(ny, BAND + SHEEP.radius, BOARD.height - SHEEP.radius);
  }
  sheep.nextHopAt = game.time + hopGap(sheep.speed) / urgency;
}

/** One tick of the flock: every sheep in the field whose beat has come hops. */
export function stepSheep(game: FlockGame): void {
  "worklet";
  for (let index = 0; index < game.sheep.length; index += 1) {
    const sheep = game.sheep[index]!;
    if (sheep.state === SHEEP_STATE.field && game.time >= sheep.nextHopAt) hop(game, index);
  }
}
