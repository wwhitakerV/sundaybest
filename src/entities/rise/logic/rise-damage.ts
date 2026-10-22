import { MODE, type Balloon, type RiseGame } from "./rise-rules";
import { hash01 } from "./rise-setup";

/**
 * What a burst leaves: black paint, thrown out and falling, landing on the
 * glass where it stays — splats stretched by how fast they hit, specks
 * around the big ones, some running down — and scraps of torn latex,
 * caught on the line or lying on the floor. A clean pop leaves nothing:
 * its scraps fall away. Worklets, each after what it calls.
 */

const TAU = Math.PI * 2;
/** The burst's heart: a blob this share of the balloon's width, with lobes round it. */
const CORE = { size: 0.14, lobes: 11 };
/** The spray: drops, how fast (points/ms), how much it throws up, how big, how long in the air (ms). */
const SPRAY = { drops: 48, least: 0.12, more: 0.62, upward: 0.22, small: 1.2, big: 6.5 };
const FLIGHT = { least: 220, more: 900 };
/** Paint falls under this (points/ms²). */
const GRAVITY = 0.0011;
/** Drips: from drops this big, this often, this long, running this fast. */
const DRIP = { from: 3.5, odds: 0.18, least: 8, more: 30, speed: 0.025, width: 0.5 };
/** Specks round a landed drop this big. */
const SPECKS = { from: 3, count: 2 };
/** Scraps of latex: how many a burst and a pop leave, how big, how they're thrown and fall. */
const SCRAP = { burst: 5, pop: 3, least: 10, more: 12, up: 0.42, aside: 0.28, spin: 0.012 };
const SCRAP_FALL = { gravity: 0.0012, drag: 0.0015, gone: 30 };

/** Paint landed at (x, y), stretched along (sx, sy). */
function addSplat(game: RiseGame, x: number, y: number, r: number, sx: number, sy: number): void {
  "worklet";
  game.splats.push(x, y, r, sx, sy);
}

/** Scraps torn from a balloon, thrown up and out. */
function addScraps(game: RiseGame, b: Balloon, count: number, clean: boolean, key: number): void {
  "worklet";
  const { balloonW, balloonH } = game.stage;
  for (let i = 0; i < count; i += 1) {
    const seed = key * 13 + i;
    game.scraps.push({
      x: b.x + (hash01(seed, 1) - 0.5) * balloonW * 0.5 * b.scale,
      y: b.y + (hash01(seed, 2) - 0.5) * balloonH * 0.4 * b.scale,
      vx: (hash01(seed, 3) - 0.5) * 2 * SCRAP.aside,
      vy: -SCRAP.up * (0.5 + hash01(seed, 4)),
      angle: hash01(seed, 5) * TAU,
      spin: (hash01(seed, 6) - 0.5) * SCRAP.spin,
      size: (SCRAP.least + hash01(seed, 7) * SCRAP.more) * b.scale,
      seed,
      rest: 0,
      clean,
    });
  }
}

/** A balloon bursts in black: a blob where it was, a spray of drops, scraps left behind. */
export function burstBalloon(game: RiseGame, index: number): void {
  "worklet";
  const b = game.balloons[index]!;
  const key = index + 1;
  const core = game.stage.balloonW * CORE.size * b.scale;
  addSplat(game, b.x, b.y, core, 0, 0);
  for (let i = 0; i < CORE.lobes; i += 1) {
    const angle = (i / CORE.lobes + hash01(key, i) * 0.08) * TAU;
    const out = core * (0.7 + hash01(key, i + 20) * 0.6);
    const r = core * (0.28 + hash01(key, i + 40) * 0.35);
    const streak = core * (0.6 + hash01(key, i + 60) * 1.6);
    const [sx, sy] = [Math.cos(angle) * streak, Math.sin(angle) * streak];
    addSplat(game, b.x + Math.cos(angle) * out, b.y + Math.sin(angle) * out, r, sx, sy);
  }
  for (let i = 0; i < SPRAY.drops; i += 1) {
    const seed = key * 101 + i;
    const angle = hash01(seed, 1) * TAU;
    const speed = SPRAY.least + hash01(seed, 2) ** 2 * SPRAY.more;
    game.drops.push({
      x: b.x + Math.cos(angle) * core * 0.6,
      y: b.y + Math.sin(angle) * core * 0.6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - SPRAY.upward,
      r: SPRAY.small + hash01(seed, 3) ** 3 * SPRAY.big,
      landAt: game.time + FLIGHT.least + hash01(seed, 4) * FLIGHT.more,
    });
  }
  addScraps(game, b, SCRAP.burst, false, key);
  b.mode = MODE.popped;
  game.events.bursts += 1;
}

/** A balloon pops without paint: its scraps fall away — or, when `leavesScraps`, stay where they land. */
export function popBalloon(game: RiseGame, index: number, leavesScraps: boolean): void {
  "worklet";
  const b = game.balloons[index]!;
  addScraps(game, b, SCRAP.pop, !leavesScraps, index + 51);
  b.mode = MODE.popped;
  game.events.pops += 1;
}

/** A drop hits the glass: a splat stretched by its speed, specks round it, and perhaps a drip. */
function land(game: RiseGame, drop: RiseGame["drops"][number], seed: number): void {
  "worklet";
  const speed = Math.hypot(drop.vx, drop.vy) || 1;
  const stretch = Math.min(1.8, speed * 2.2) * drop.r;
  addSplat(game, drop.x, drop.y, drop.r, (drop.vx / speed) * stretch, (drop.vy / speed) * stretch);
  if (drop.r >= SPECKS.from) {
    for (let i = 0; i < SPECKS.count; i += 1) {
      const angle = hash01(seed, i) * TAU;
      const out = drop.r * (1.6 + hash01(seed, i + 5) * 1.4);
      const r = drop.r * 0.22 * (0.6 + hash01(seed, i + 9));
      addSplat(game, drop.x + Math.cos(angle) * out, drop.y + Math.sin(angle) * out, r, 0, 0);
    }
  }
  if (drop.r >= DRIP.from && hash01(seed, 31) < DRIP.odds) {
    const length = DRIP.least + hash01(seed, 32) * DRIP.more;
    game.drips.push(drop.x, drop.y, 0, length, drop.r * DRIP.width);
  }
}

/** One step of the mess: drops flying and landing, drips running, scraps falling to rest. */
export function stepDamage(game: RiseGame, dt: number): void {
  "worklet";
  const { stage } = game;
  const flying: RiseGame["drops"] = [];
  game.drops.forEach((drop, index) => {
    drop.vy += GRAVITY * dt;
    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;
    if (game.time >= drop.landAt || drop.y > stage.height)
      land(game, drop, game.splats.length + index);
    else flying.push(drop);
  });
  game.drops = flying;
  for (let i = 0; i < game.drips.length; i += 5) {
    const length = game.drips[i + 2]!;
    const full = game.drips[i + 3]!;
    if (length < full) {
      game.drips[i + 2] = Math.min(full, length + DRIP.speed * dt * (1 - (length / full) * 0.8));
    }
  }
  for (const scrap of game.scraps) {
    if (scrap.rest !== 0) continue;
    const before = scrap.y;
    scrap.vy += SCRAP_FALL.gravity * dt;
    scrap.vx *= 1 - Math.min(1, SCRAP_FALL.drag * dt);
    scrap.x += scrap.vx * dt;
    scrap.y += scrap.vy * dt;
    scrap.angle += scrap.spin * dt;
    const onLine = stage.lineY - scrap.size * 0.25;
    if (scrap.clean) {
      if (scrap.y > stage.height + SCRAP_FALL.gone) scrap.rest = 3;
    } else if (scrap.vy > 0 && before < stage.lineY - 1 && scrap.y >= onLine) {
      scrap.y = stage.lineY - scrap.size * 0.2;
      scrap.rest = 1;
    } else if (scrap.y >= stage.height - scrap.size * 0.35) {
      scrap.y = stage.height - scrap.size * 0.35;
      scrap.rest = 2;
    }
  }
  game.scraps = game.scraps.filter((scrap) => scrap.rest !== 3);
}

/** The practice pair's mess swept away — the only time the screen is ever cleared. */
export function clearMess(game: RiseGame): void {
  "worklet";
  game.drops = [];
  game.splats = [];
  game.drips = [];
  game.scraps = [];
  game.glass = [];
  game.gains = [];
  for (const b of game.balloons) {
    if (game.pairs[b.pair]!.practice) b.mode = MODE.gone;
  }
}
