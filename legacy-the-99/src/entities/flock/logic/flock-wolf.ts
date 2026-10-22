import { clamp, mix } from "./flock-geometry";
import { BAND, BOARD, SHEEP, SHEEP_STATE, STEP_MS, WOLF, type FlockGame } from "./flock-rules";

/**
 * The wolf: one, gliding smoothly — never answering a call. It weighs up the
 * sheep it can see, preferring the near and the alone; the longer it keeps
 * choosing the same one, the more settled it is (`focus`, its V narrowing),
 * until it locks on and runs. Slow over a group, faster after a sheep alone,
 * fastest locked on. It never comes near the gate, which is safe. Worklets,
 * each after what it calls.
 */

/** How far apart sheep count as together, and how much company makes a sheep "in a group". */
const COMPANY = { within: 70, group: 6 };
/** How much a sheep's company counts against it, in points of distance. */
const COMPANY_COST = 55;
/** How fast the wolf can turn, in radians a millisecond: smooth, never snapping round. */
const TURN = 0.004;

/** How many field sheep stand within `COMPANY.within` of one. */
function company(game: FlockGame, index: number): number {
  "worklet";
  const sheep = game.sheep[index]!;
  let count = 0;
  for (let j = 0; j < game.sheep.length; j += 1) {
    const other = game.sheep[j]!;
    if (j === index || other.state !== SHEEP_STATE.field) continue;
    const dx = other.x - sheep.x;
    const dy = other.y - sheep.y;
    if (dx * dx + dy * dy < COMPANY.within * COMPANY.within) count += 1;
  }
  return count;
}

/** The sheep the wolf would choose now: the nearest, counting company against it — or -1. */
function choose(game: FlockGame): number {
  "worklet";
  let best = -1;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let index = 0; index < game.sheep.length; index += 1) {
    const sheep = game.sheep[index]!;
    if (sheep.state !== SHEEP_STATE.field) continue;
    const away = Math.hypot(sheep.x - game.wolf.x, sheep.y - game.wolf.y);
    if (away > WOLF.sight) continue;
    const score = away + company(game, index) * COMPANY_COST;
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  }
  if (best >= 0) return best;
  // None in sight: the nearest of any left.
  for (let index = 0; index < game.sheep.length; index += 1) {
    const sheep = game.sheep[index]!;
    if (sheep.state !== SHEEP_STATE.field) continue;
    const away = Math.hypot(sheep.x - game.wolf.x, sheep.y - game.wolf.y);
    if (away < bestScore) {
      bestScore = away;
      best = index;
    }
  }
  return best;
}

/** Keeps the wolf out of the gate's guard and in the field. */
function keepOut(game: FlockGame): void {
  "worklet";
  const { wolf } = game;
  const dx = wolf.x - game.gateX;
  const dy = wolf.y - BAND;
  const away = Math.hypot(dx, dy);
  if (away < WOLF.gateGuard && away > 0) {
    wolf.x = game.gateX + (dx / away) * WOLF.gateGuard;
    wolf.y = BAND + (dy / away) * WOLF.gateGuard;
  }
  wolf.x = clamp(wolf.x, WOLF.radius, BOARD.width - WOLF.radius);
  wolf.y = clamp(wolf.y, BAND + WOLF.radius, BOARD.height - WOLF.radius);
}

/** Takes any field sheep the wolf has reached: gone, counted, and the wolf starts weighing up again. */
function takeReached(game: FlockGame): void {
  "worklet";
  const reach = WOLF.radius + SHEEP.radius;
  for (const sheep of game.sheep) {
    if (sheep.state !== SHEEP_STATE.field) continue;
    if (Math.hypot(sheep.x - game.wolf.x, sheep.y - game.wolf.y) < reach) {
      sheep.state = SHEEP_STATE.taken;
      game.taken += 1;
      game.wolf.focus = 0;
      game.wolf.target = -1;
    }
  }
}

/** One tick of the wolf: settling on a sheep, turning toward it, gliding on — and taking what it reaches. */
export function stepWolf(game: FlockGame): void {
  "worklet";
  const { wolf } = game;
  const choice = choose(game);
  if (choice < 0) return;
  // The sheep it was settling on is saved, or gone: it starts over on the new one.
  if (wolf.target < 0 || game.sheep[wolf.target]!.state !== SHEEP_STATE.field) {
    wolf.target = choice;
    wolf.focus = 0;
  }
  if (choice === wolf.target) {
    const before = wolf.focus;
    wolf.focus = Math.min(1, wolf.focus + STEP_MS / WOLF.lockMs);
    if (before < 1 && wolf.focus >= 1) game.locks += 1;
  } else {
    // Torn between sheep: it unsettles, and once unsettled takes the new one.
    wolf.focus = Math.max(0, wolf.focus - (2 * STEP_MS) / WOLF.lockMs);
    if (wolf.focus === 0 || wolf.target < 0) wolf.target = choice;
  }
  const target = game.sheep[wolf.target]!;
  const alone = 1 - Math.min(1, company(game, wolf.target) / COMPANY.group);
  const speed = wolf.focus >= 1 ? WOLF.locked : mix(WOLF.evaluating, WOLF.isolated, alone);
  const wanted = Math.atan2(target.y - wolf.y, target.x - wolf.x);
  let turn = wanted - wolf.heading;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  wolf.heading += clamp(turn, -TURN * STEP_MS, TURN * STEP_MS);
  wolf.x += Math.cos(wolf.heading) * speed * STEP_MS;
  wolf.y += Math.sin(wolf.heading) * speed * STEP_MS;
  keepOut(game);
  takeReached(game);
}
