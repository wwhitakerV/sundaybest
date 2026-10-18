import { clamp01, easeInOut } from "../ease";
import type { Tear } from "../frame-types";
import { GRAVITY } from "../settings";
import { waterDripsAt } from "./frame-drips";
import { waterAt } from "./frame-water";
import { meltAt, type Melt } from "./melt";
import type { WaterScene } from "./scene";

/** A letter at one moment: how far it has fallen, its tilt, its melt, and how it's drawn. */
type WaterLetter = {
  /** How far it has fallen, in points. */
  dy: number;
  /** Its tilt, in degrees, about its own centre (`cx`, in wordmark units). */
  rot: number;
  cx: number;
  /** Reaching the pool: drawn as part of the water, so it merges into it. */
  liquid: boolean;
  visible: boolean;
  melt: Melt;
};

/** Everything to draw at one moment of the water intro. */
export type WaterFrame = {
  /** Each pen line's progress, 0–1, in writing order. */
  strokes: number[];
  /** Each letter's fill coming in under its pen lines once they're done, 0–1. */
  inks: number[];
  /** The pen is still writing: the letters show only where it has been. */
  writing: boolean;
  letters: WaterLetter[];
  /** The water's loose drops, as capsules: [centre x, top, bottom, width, …]. */
  blobs: number[];
  /** The crisp drops: hanging and falling from the letters, and the drain's pops. */
  tears: Tear[];
  /** The water's edge, left to right: [x, y, …]; empty when there's no water. */
  edge: number[];
  /** The screen is full of water from edge to edge: nothing under it shows. */
  full: boolean;
  /** The blank beat before the pour: nothing shows, but the water's filters are put to work once. */
  warming: boolean;
};

/**
 * Everything to draw at `t` ms into the water intro. Pure: the same scene and
 * time always give the same frame, so any moment can be drawn, tested, or replayed.
 */
export function waterFrameAt(scene: WaterScene, t: number): WaterFrame {
  "worklet";
  const { world, beats, strokes, letterEnds, settings } = scene;

  const reveals: number[] = [];
  for (const stroke of strokes) {
    reveals.push(easeInOut(clamp01((t - stroke.start) / (stroke.end - stroke.start))));
  }
  const inks: number[] = [];
  for (const end of letterEnds) inks.push(clamp01((t - end) / 180));

  // A letter falls, melting as it goes, and just before it touches the water it becomes
  // the water: drawn as part of the pool, so it merges into the surface and pours away.
  const letters: WaterLetter[] = [];
  world.falls.forEach((f, li) => {
    const s = t - f.start;
    const dy = s > 0 ? 0.5 * GRAVITY.letter * s * s : 0;
    letters.push({
      dy,
      rot: f.rot * clamp01(dy / 220),
      cx: f.cx,
      liquid: t >= f.hit - 50,
      visible: t < f.gone,
      melt: meltAt(settings.melt, f, li, t),
    });
  });

  const tears: Tear[] = [];
  const blobs: number[] = [];
  const edge: number[] = [];
  if (t >= 0) {
    waterDripsAt(scene, t, tears, blobs);
    waterAt(scene, t, edge, blobs);
  }

  return {
    strokes: reveals,
    inks,
    writing: t < beats.write.end,
    letters,
    blobs,
    tears,
    edge,
    full: t >= beats.hold.start && t < beats.drain.start,
    warming: t < 0,
  };
}
