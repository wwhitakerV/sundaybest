import type { ExamBand } from "../types";

/** The label of the highest band a percentage reaches, from the exam's own bands; null if none. */
export function getBandLabel(percentage: number, bands: readonly ExamBand[]): string | null {
  const reached = [...bands]
    .sort((a, b) => b.minPercent - a.minPercent)
    .find((band) => percentage >= band.minPercent);
  return reached?.label ?? null;
}
