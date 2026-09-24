import type { PlanGenerationError, PlanGenerationStatus } from "@/types/domain";

import { hasNoCaptions } from "./sermon-catalog";

/** Where a mock build stops, and why. */
export type MockBuildFailure = { at: PlanGenerationStatus; error: PlanGenerationError };

/**
 * Whether building from `url` fails on its `attempt`-th try, and where —
 * never random: the same link and attempt always give the same result (see
 * `MOCK_TEST_LINKS`).
 */
export function getMockBuildFailure(url: string, attempt: number): MockBuildFailure | null {
  if (hasNoCaptions(url)) {
    return {
      at: "processingSermon",
      error: {
        code: "noCaptions",
        message: "This video doesn't have captions yet.",
      },
    };
  }
  if (/buildfail/i.test(url)) {
    return {
      at: "writingDays",
      error: { code: "unknown", message: "Something went wrong writing your days." },
    };
  }
  if (/failonce/i.test(url) && attempt === 1) {
    return {
      at: "findingScripture",
      error: { code: "network", message: "We lost the connection while finding the Scripture." },
    };
  }
  return null;
}
