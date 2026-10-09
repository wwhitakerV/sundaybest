/**
 * The only file other slices may import from. Re-export the screens, hooks, and
 * types that form this slice's public contract and nothing else.
 *
 * Deep imports such as `@/features/<name>/screens/Thing` are blocked by lint.
 */
export { ProgressScreen } from "./screens/ProgressScreen";
export { WeeksScreen } from "./screens/WeeksScreen";
// The week's strip and its days' look, for a day's finish page to show the same week.
export { WeekStrip } from "./components/WeekStrip";
export { describeWeekTile } from "./logic/week-view";
