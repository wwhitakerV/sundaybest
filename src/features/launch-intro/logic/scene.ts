import type { IntroSettings, Stage } from "./settings";
import { strokeTimings, type StrokeTiming } from "./strokes";
import { buildWorld } from "./world";
import type { World } from "./world-types";

/** One beat of the intro, in milliseconds from its start. */
export type Beat = { start: number; end: number; dur: number };

type Beats = {
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
  /** Full colour; held longer if the page underneath isn't ready. Then the page arrives. */
  hold: Beat;
};

/** Everything the intro needs to draw any moment of itself. */
export type Scene = {
  stage: Stage;
  settings: IntroSettings;
  strokes: StrokeTiming[];
  letterEnds: number[];
  beats: Beats;
  world: World;
  /** When the intro is over: the end of the hold, as the page arrives under it. */
  total: number;
};

/** The whole intro for these settings on this screen, worked out once. */
export function buildScene(settings: IntroSettings, stage: Stage): Scene {
  const { strokes, letterEnds } = strokeTimings(settings.writeMs);
  const beat = (start: number, dur: number): Beat => ({ start, end: start + dur, dur });

  const write = beat(0, settings.writeMs);
  const pause = beat(write.end, settings.pauseMs);
  const world = buildWorld(settings, stage, strokes, write.end, pause.end);
  const fall = beat(pause.end, Math.max(...world.falls.map((f) => f.gone)) - pause.end);
  const sink = beat(fall.end, settings.sinkMs);
  const splash = beat(sink.end, settings.splashMs);
  const hold = beat(splash.end, settings.holdMs);

  return {
    stage,
    settings,
    strokes,
    letterEnds,
    beats: { write, pause, fall, sink, splash, hold },
    world,
    total: hold.end,
  };
}
