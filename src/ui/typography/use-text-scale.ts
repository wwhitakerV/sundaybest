/**
 * How much larger than designed the reader wants their text — the single
 * seam for the Text size setting (`settings.textSize`), which is stored but
 * not yet applied. Every typography component reads it. Returns 1 until
 * that's wired.
 */
export function useTextScale(): number {
  return 1;
}
