/**
 * A spring's overshoot, folded back at 0 and 1: past an end, it comes back
 * off it instead — a ball off a wall. Something sprung with it bounces off
 * both ends, never beyond either, and never stalls against them. A worklet,
 * so it runs on the UI thread with the animation.
 */
export function bounceWithin(value: number): number {
  "worklet";
  if (value < 0) return -value;
  if (value > 1) return 2 - value;
  return value;
}
