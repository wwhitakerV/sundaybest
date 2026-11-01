/**
 * The small line under a plan's title naming the series its sermon is from,
 * and which part: "Unshakable · Part II", "Unshakable", "Part II", or null
 * for a sermon from none. Both come from the video's own title.
 */
export function seriesLine(sermon: { series: string | null; part: string | null }): string | null {
  const parts = [sermon.series, sermon.part].filter((part): part is string => part !== null && part.trim() !== "");
  return parts.length > 0 ? parts.join(" · ") : null;
}
