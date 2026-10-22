/** How many letters are in flight at once: the ribbon's length. */
export const RIBBON_WINDOW = 9;

/**
 * How far letter `slot` has landed (0–1) when the ribbon has reached
 * `progress`: it starts as the ribbon reaches it and settles `RIBBON_WINDOW`
 * slots later, easing out — quick from a distance, soft onto the page.
 */
export function ribbonLanding(progress: number, slot: number): number {
  "worklet";
  const t = Math.min(1, Math.max(0, (progress - slot) / RIBBON_WINDOW));
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

/**
 * The ribbon's slots: one per letter of every paragraph, in order, with
 * `pauseSlots` empty ones between paragraphs — a breath that keeps the clock
 * running, so letters still in flight never stop mid-air. `starts` is each
 * paragraph's first slot; `letterAt` what each slot writes ("" for a pause).
 */
export function ribbonSlots(paragraphs: readonly string[], pauseSlots: number) {
  const starts: number[] = [];
  const letterAt: string[] = [];
  paragraphs.forEach((text, index) => {
    if (index > 0) for (let pause = 0; pause < pauseSlots; pause += 1) letterAt.push("");
    starts.push(letterAt.length);
    for (let at = 0; at < text.length; at += 1) letterAt.push(text.charAt(at));
  });
  return { starts, letterAt, total: letterAt.length };
}
