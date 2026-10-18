import { WORD } from "../wordmark";
import type { WaterFrame } from "./frame";
import type { WaterScene } from "./scene";

/**
 * Room above the water for what its look reaches past its outline: the liquid
 * blur, the glass's spectrum and its deep bands, in points.
 */
const EDGE_ROOM = 48;

/**
 * The highest point the pool's water reaches this frame — its surface, the
 * drops it throws up, and the letters pouring into it — with room for its edge,
 * in points from the top of the screen; null when there's no water at all. The
 * pool's water is drawn only below it, so its glass is worked out only where
 * there's water to show, not across the whole screen.
 */
export function wetTop(scene: WaterScene, frame: WaterFrame): number | null {
  "worklet";
  let top = Infinity;
  for (let i = 1; i < frame.edge.length; i += 2) top = Math.min(top, frame.edge[i] ?? Infinity);
  for (let i = 1; i < frame.blobs.length; i += 4) top = Math.min(top, frame.blobs[i] ?? Infinity);
  const { cy, ws } = scene.world;
  for (const letter of frame.letters) {
    // A tilted letter reaches a little above its own top.
    if (letter.visible && letter.liquid) top = Math.min(top, cy - WORD.height * ws + letter.dy);
  }
  return top === Infinity ? null : top - EDGE_ROOM;
}
