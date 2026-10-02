/** The study's text size, said: "Default", "2 points larger", "4 points smaller". */
export function describeTextOffset(offset: number): string {
  if (offset === 0) return "Default";
  const points = Math.abs(offset);
  return `${points} ${points === 1 ? "point" : "points"} ${offset > 0 ? "larger" : "smaller"}`;
}
