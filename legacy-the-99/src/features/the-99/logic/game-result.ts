import { SHEEP } from "@/entities/flock";

/**
 * A day's run, in words: how many were saved (the score) and lost, how it
 * compares with the day before — and what's shared, which gives nothing away.
 */
export function describeResult({
  saved,
  yesterdaySaved,
  daily,
}: {
  saved: number;
  /** The day before's count, when it was played. */
  yesterdaySaved: number | null;
  /** "DAILY 001". */
  daily: string;
}) {
  const lost = SHEEP.count - saved;
  const compared =
    yesterdaySaved === null
      ? null
      : saved > yesterdaySaved
        ? "More than yesterday."
        : saved < yesterdaySaved
          ? `Yesterday you saved ${yesterdaySaved}.`
          : "As many as yesterday.";
  return {
    headline: saved === SHEEP.count ? "Every one saved." : `${saved} saved. ${lost} lost.`,
    compared,
    share: `The 99 · ${daily}\n${saved} of ${SHEEP.count} saved`,
  };
}
