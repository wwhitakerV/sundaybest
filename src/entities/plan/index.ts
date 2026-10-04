/**
 * The only file other layers may import from: this entity's public contract.
 * Deep imports such as `@/entities/plan/ui/Thing` are blocked by lint.
 */
export { getHeroPalette } from "./logic/hero-palette";
export { getPlanEndsLine } from "./logic/plan-ends-line";
export { formatDay, formatDayOfTotal, formatPlanLength } from "./logic/plan-wording";
export { describePlanHero } from "./logic/plan-hero";
export {
  HOME_HREF,
  PLANS_HREF,
  NEW_PLAN_HREF,
  dayCompleteHref,
  parsePlanParams,
  parseStudyParams,
  planOverviewHref,
  planCompleteHref,
  quickCheckHref,
  studyHref,
} from "./routes";
export { HeroContent, type ContinueHandOver, type HeroPlan } from "./ui/HeroContent";
export { HeroBackdrop } from "./ui/HeroBackdrop";
export { HeroContentFade } from "./ui/HeroContentFade";
export { HERO_BOTTOM_SPACE, HERO_WORDS_GAP } from "./ui/hero-layout";
