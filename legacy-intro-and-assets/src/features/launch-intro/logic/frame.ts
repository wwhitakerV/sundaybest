import { clamp01, easeInOut } from "./ease";
import { dripsAt } from "./frame-drips";
import type { Frame, LetterState, Tear } from "./frame-types";
import { waterAt } from "./frame-water";
import type { Scene } from "./scene";
import { GRAVITY } from "./settings";

/**
 * Everything to draw at `t` ms into the intro. Pure: the same scene and time
 * always give the same frame, so any moment can be drawn, tested, or replayed.
 */
export function frameAt(scene: Scene, t: number): Frame {
  "worklet";
  const { world, beats, strokes, letterEnds } = scene;

  const reveals: number[] = [];
  for (const stroke of strokes) {
    reveals.push(easeInOut(clamp01((t - stroke.start) / (stroke.end - stroke.start))));
  }
  const inks: number[] = [];
  for (const end of letterEnds) inks.push(clamp01((t - end) / 180));

  // A letter falls, and just before it touches the water it becomes the water: drawn as
  // part of the pool's liquid, so it merges into the surface and pours away into it.
  const letters: LetterState[] = [];
  for (const f of world.falls) {
    const s = t - f.start;
    const dy = s > 0 ? 0.5 * GRAVITY.letter * s * s : 0;
    letters.push({
      dy,
      rot: f.rot * clamp01(dy / 220),
      cx: f.cx,
      liquid: t >= f.hit - 50,
      visible: t < f.gone,
    });
  }

  const tears: Tear[] = [];
  const blobs: number[] = [];
  const edge: number[] = [];
  dripsAt(scene, t, tears, blobs);
  waterAt(scene, t, edge, blobs);

  return {
    strokes: reveals,
    inks,
    writing: t < beats.write.end,
    letters,
    blobs,
    tears,
    edge,
    allRed: t >= beats.hold.start,
    warming: t < 0,
  };
}
