import type { Beat } from "../scene";
import { GRAVITY, type Stage } from "../settings";
import { strokeTimings, type StrokeTiming } from "../strokes";
import { clearsAt, drainOf, releaseAt } from "./drain";
import type { WaterSettings } from "./settings";
import { buildWaterWorld } from "./world";
import type { WaterWorld } from "./world-types";

type WaterBeats = {
  /** The pool pours in before the pen starts (TextDrawStartAfterPoolEntry; it keeps pouring after). */
  pour: Beat;
  /** The pen writes; the letters drip into the pool. */
  write: Beat;
  /** Still dripping, before the letters let go. */
  pause: Beat;
  /** The letters fall and pour into the pool. */
  fall: Beat;
  /** The water heaves, before it erupts. */
  sink: Beat;
  /** The pool erupts and fills the screen. */
  splash: Beat;
  /** Full of water; held longer if the page underneath isn't ready. */
  hold: Beat;
  /** The water falls away, revealing the page. */
  drain: Beat;
};

/** Everything the water intro needs to draw any moment of itself. */
export type WaterScene = {
  stage: Stage;
  settings: WaterSettings;
  strokes: StrokeTiming[];
  letterEnds: number[];
  beats: WaterBeats;
  world: WaterWorld;
  /** When the page is revealed under the water: as it starts to drain. */
  revealAt: number;
  /** When the intro is over: the last of the water has left the screen. */
  total: number;
};

/** When the last drop has left the screen: the drained water, its shed drops, and its pops. */
function waterGoneAt(scene: Pick<WaterScene, "stage" | "beats" | "world">): number {
  const H = scene.stage.height;
  let last = scene.beats.drain.end;
  for (const pop of scene.world.pops) {
    // It rises from the bottom and falls back out through it.
    const v = Math.sqrt(2 * GRAVITY.pop * pop.h);
    const flight = (v + Math.sqrt(v * v + 8 * GRAVITY.pop)) / GRAVITY.pop;
    last = Math.max(last, clearsAt(scene, pop.x) + pop.delay + flight);
  }
  const d = drainOf(scene);
  for (const shed of scene.world.drain.shed) {
    // It leaves the falling top edge, a little slower than the water, and falls off the bottom.
    const fell = shed.at * d.fallFor;
    const y0 = d.top0 + 0.5 * d.g * fell * fell;
    const v = d.g * fell * shed.lag;
    const below = H + shed.r - y0;
    const fall = (-v + Math.sqrt(v * v + 2 * d.g * below)) / d.g;
    last = Math.max(last, d.start + releaseAt(scene, shed.x) + fell + fall);
  }
  return last + 1;
}

/** The whole water intro for these settings on this screen, worked out once. */
export function buildWaterScene(settings: WaterSettings, stage: Stage): WaterScene {
  const beat = (start: number, dur: number): Beat => ({ start, end: start + dur, dur });
  const pour = beat(0, settings.textDrawStartAfterPoolEntry);
  const write = beat(pour.end, settings.writeMs);
  const pause = beat(write.end, settings.pauseMs);

  const timing = strokeTimings(settings.writeMs);
  const strokes = timing.strokes.map((stroke) => ({
    ...stroke,
    start: stroke.start + write.start,
    end: stroke.end + write.start,
  }));
  const letterEnds = timing.letterEnds.map((end) => end + write.start);

  const world = buildWaterWorld(settings, stage, strokes, write, pause.end);
  const fall = beat(pause.end, Math.max(...world.falls.map((f) => f.gone)) - pause.end);
  const sink = beat(fall.end, settings.sinkMs);
  const splash = beat(sink.end, settings.splashMs);
  const hold = beat(splash.end, settings.holdMs);
  const drain = beat(hold.end, settings.drainMs);
  const beats = { pour, write, pause, fall, sink, splash, hold, drain };

  return {
    stage,
    settings,
    strokes,
    letterEnds,
    beats,
    world,
    revealAt: drain.start,
    total: waterGoneAt({ stage, beats, world }),
  };
}
