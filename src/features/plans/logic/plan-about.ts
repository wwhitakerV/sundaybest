import type { ApiPlanAbout } from "@/core/api/contracts";

export type PlanAboutLook = {
  overview: readonly string[];
  /** Each Scripture the sermon names, by reference, in the sermon's order. */
  scriptures: readonly string[];
  takeaways: readonly string[];
};

/** Plan Overview's About this plan; nothing for plans generated before it existed. */
export function describePlanAbout(about: ApiPlanAbout | null): PlanAboutLook | null {
  if (!about) return null;
  return {
    overview: about.overview,
    scriptures: about.scripturesReferenced.map((citation) => citation.reference),
    takeaways: about.keyTakeaways,
  };
}
