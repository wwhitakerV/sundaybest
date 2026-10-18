import type { Drip, Fall, Heave, Impact, Spray, World } from "../world-types";
import type { Pour } from "./pour";

/** A drop the drained water throws up as it leaves the bottom, like a coin dropped into water. */
type Pop = { x: number; h: number; r: number; delay: number };

/** A drop shed from the draining water's top edge, trailing it down. */
type Shed = { x: number; at: number; lag: number; vx: number; r: number };

/** Everything that happens in the water intro, worked out once and then only read. */
export type WaterWorld = {
  /** Points per wordmark unit. */
  ws: number;
  cx: number;
  cy: number;
  /** Where drips hang from: the letters' bottom edge, in points. */
  yb: number;
  /** The screen's height, in points. */
  height: number;
  /** How positions across the screen scale from the prototype's. */
  sx: number;
  /** Drips, in the order they let go. */
  drips: Drip[];
  /** Height per unit of landed drip volume, so the drips bring in a whole pool's worth. */
  perVolume: number;
  /** How deep the pool pours in, in points. */
  poolH: number;
  /** How much of the drips' volume raises the pool (WaterVolumeFromDrip). */
  volumeFromDrip: number;
  pour: Pour;
  falls: Fall[];
  impacts: Impact[];
  heaves: Heave[];
  spray: Spray[];
  sheetPhase: number[];
  splash: World["splash"];
  pops: Pop[];
  drain: { phase: number[]; shed: Shed[] };
};
