/** Types owned by this slice. Anything another slice needs must be re-exported from `index.ts`. */
import type { PlanDay, Prayer, Reflection, ScripturePassage } from "@/types/domain";

/** Everything one day's Daily Study shows, from the store. */
export type StudyDayContent = {
  day: PlanDay;
  /** In the user's Bible translation where the passage is there in it. */
  scripture: ScripturePassage | null;
  reflections: Reflection[];
  prayer: Prayer | null;
};
