import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { sermonSources } from "../db/schema.js";
import { TITLE_VERSION } from "../generation/prompts/version.js";
import type { GenerationHooks, PlanGenerationProvider } from "../providers/plan-generation-provider.js";

type Sermon = typeof sermonSources.$inferSelect;

/**
 * The title a sermon's plans carry: its own, found once by the title step and
 * kept on the sermon with its series and part, or its video's title as it is
 * when the step can't find one — then its next plan tries again. Never
 * throws: a title never fails a plan.
 */
export async function sermonTitle(db: Database, generator: PlanGenerationProvider, sermon: Sermon, report?: GenerationHooks["report"]): Promise<string> {
  if (sermon.displayTitle && sermon.titledVersion === TITLE_VERSION) return sermon.displayTitle;
  try {
    const found = await generator.findTitle?.({ title: sermon.title, church: sermon.churchOrChannel }, report);
    if (!found) return sermon.title;
    // Kept only while the video still has the title it was found in.
    await db.update(sermonSources)
      .set({ displayTitle: found.title, series: found.series, seriesPart: found.part, titledVersion: TITLE_VERSION, updatedAt: new Date() })
      .where(and(eq(sermonSources.id, sermon.id), eq(sermonSources.title, sermon.title)));
    return found.title;
  } catch {
    return sermon.title;
  }
}
