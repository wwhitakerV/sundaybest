import type { Balloon, RiseGame } from "./rise-rules";

/**
 * Two bodies touching, solved: pushed fully apart, then bounced — by their
 * masses (a balloon's goes with its size) and how they turn (where it's
 * hit, off its middle, sets it spinning), with a little friction where they
 * rub — and each squashed by how hard it was knocked. Worklets, each after
 * what it calls.
 */

/** Where two bodies touch: how deep, the point, and the way from the first to the second. */
export type Contact = { depth: number; px: number; py: number; nx: number; ny: number };

/** How a balloon's mass spreads about its middle, as a share of its half-width: how readily it turns. */
const GYRATION = 0.8;
/** Friction where balloons rub: how much of a bounce's push it can match. */
const FRICTION = 0.25;
/** A knock's squash, by how hard, and at most. */
const SQUASH = { per: 0.012, most: 0.0007 };

/** A body's give: how much a push moves it (1 / mass) and turns it (1 / inertia) — none for an edge. */
function give(b: Balloon | null, game: RiseGame): { move: number; turn: number } {
  "worklet";
  if (!b) return { move: 0, turn: 0 };
  const mass = b.scale * b.scale;
  const radius = (game.stage.balloonW / 2) * b.scale * GYRATION;
  return { move: 1 / mass, turn: 1 / (mass * radius * radius) };
}

/** A push on a body at the contact, along (jx, jy): moving and turning it. */
function push(
  b: Balloon | null,
  rx: number,
  ry: number,
  jx: number,
  jy: number,
  g: { move: number; turn: number },
) {
  "worklet";
  if (!b) return;
  b.vx += jx * g.move;
  b.vy += jy * g.move;
  b.spin += (rx * jy - ry * jx) * g.turn;
}

/**
 * Solves a touch between `first` (or an edge, null) and `second`, the
 * contact's normal running from the first to the second: overlap undone
 * by each one's give, then a bounce keeping `keep` of the closing speed,
 * friction, and a squash.
 */
export function resolveContact(
  game: RiseGame,
  first: Balloon | null,
  second: Balloon,
  contact: Contact,
  keep: number,
): void {
  "worklet";
  const { px, py, nx, ny, depth } = contact;
  const a = give(first, game);
  const b = give(second, game);
  const total = a.move + b.move;
  if (first) {
    first.x -= nx * depth * (a.move / total);
    first.y -= ny * depth * (a.move / total);
  }
  second.x += nx * depth * (b.move / total);
  second.y += ny * depth * (b.move / total);
  const [rax, ray] = first ? [px - first.x, py - first.y] : [0, 0];
  const [rbx, rby] = [px - second.x, py - second.y];
  const vax = first ? first.vx - first.spin * ray : 0;
  const vay = first ? first.vy + first.spin * rax : 0;
  const relX = second.vx - second.spin * rby - vax;
  const relY = second.vy + second.spin * rbx - vay;
  const closing = relX * nx + relY * ny;
  if (closing >= 0) return;
  const ran = rax * ny - ray * nx;
  const rbn = rbx * ny - rby * nx;
  const along = (-(1 + keep) * closing) / (total + ran * ran * a.turn + rbn * rbn * b.turn);
  const [tx, ty] = [-ny, nx];
  const slide = relX * tx + relY * ty;
  const rat = rax * ty - ray * tx;
  const rbt = rbx * ty - rby * tx;
  const across = Math.max(
    -FRICTION * along,
    Math.min(FRICTION * along, -slide / (total + rat * rat * a.turn + rbt * rbt * b.turn)),
  );
  const jx = nx * along + tx * across;
  const jy = ny * along + ty * across;
  push(first, rax, ray, -jx, -jy, a);
  push(second, rbx, rby, jx, jy, b);
  if (first) first.pokeV += Math.min(SQUASH.most, along * a.move * SQUASH.per);
  second.pokeV += Math.min(SQUASH.most, along * b.move * SQUASH.per);
}
