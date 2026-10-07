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

/** A takeaway's number as the list sets it, two digits: "01", "02". */
export function takeawayNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * A takeaway card's width in About this plan's deck: the page's width inside
 * its inset, less the peek that shows the next card waiting — unless there's
 * only the one, which takes the whole width.
 */
export function takeawayCardWidth({
  viewportWidth,
  inset,
  peek,
  count,
}: {
  viewportWidth: number;
  inset: number;
  peek: number;
  count: number;
}): number {
  const page = viewportWidth - inset * 2;
  return count > 1 ? page - peek : page;
}
