/**
 * Building a plan from a sermon link — a frontend stand-in for the real
 * builder. `PlanBuilder` (mounted in AppProviders) runs any build under way
 * in the store; `lookUpMockSermon` previews a link's sermon before a plan is
 * made. Deterministic throughout: `MOCK_TEST_LINKS` always fail the same way.
 */
export { BUILD_STAGE_MS, PlanBuilder } from "./PlanBuilder";
export { MOCK_TEST_LINKS, lookUpMockSermon, type SermonPreview } from "./sermon-catalog";
