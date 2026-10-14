import type { Eruption } from "../eruption";
import type { Beat } from "../scene";
import type { Stage } from "../settings";
import { levelAt } from "./pool";
import type { WaterWorld } from "./world-types";

/**
 * The water intro's eruption, thrown up from the pool's surface — the same throw
 * as the pool intro's (`eruption.ts`, whose wall and drops it shares), from the
 * water's own level.
 */
export function waterEruptionOf(scene: {
  stage: Stage;
  beats: { splash: Beat };
  world: WaterWorld;
}): Eruption {
  "worklet";
  const { beats, stage, world } = scene;
  const y0 = stage.height - levelAt(world, beats.splash.start);
  const d = y0 + 60;
  const a = 1.6 * d;
  const crossing = beats.splash.dur * 0.75;
  const g = (2 * a) / (crossing / (1 - Math.sqrt(1 - d / a))) ** 2;
  return { y0, g, vMin: Math.sqrt(2 * g * a), d, phase: world.sheetPhase, cx: world.cx };
}
