import type { PlanGenerationStatus } from "@/types/domain";
import { GENERATION_STAGES } from "@/core/store";

/** A row of Preparing's checklist: done, being worked on, or still to come. */
type StageRowState = "done" | "active" | "pending";

export type StageRow = { key: PlanGenerationStatus; label: string; state: StageRowState };

/** How far along each stage puts the ring, 0–100. */
const PERCENT = new Map<PlanGenerationStatus, number>([
  ["idle", 0],
  ["validating", 4],
  ["preparing", 12],
  ["processingSermon", 28],
  ["findingScripture", 46],
  ["writingDays", 64],
  ["buildingQuiz", 86],
  ["completed", 100],
]);

/** The percentage Preparing's ring shows for a build's stage. A failed build shows none. */
export function getPreparingPercent(status: PlanGenerationStatus): number {
  return PERCENT.get(status) ?? 0;
}

/**
 * Preparing's checklist for a build at `status`: listening to the message,
 * finding the Scripture, writing the days, and — with a Quick Check —
 * building the quiz. Stages before the current one are done, the current one
 * is active; before listening starts (validating, preparing) none are.
 */
export function getPreparingRows(
  status: PlanGenerationStatus,
  lengthDays: number,
  quickCheckEnabled: boolean,
): StageRow[] {
  const rows: { key: PlanGenerationStatus; label: string }[] = [
    { key: "processingSermon", label: "Listening to the message" },
    { key: "findingScripture", label: "Finding the Scripture" },
    {
      key: "writingDays",
      label: `Writing your ${lengthDays} ${lengthDays === 1 ? "day" : "days"}`,
    },
    ...(quickCheckEnabled ? [{ key: "buildingQuiz" as const, label: "Building your quiz" }] : []),
  ];
  const current = GENERATION_STAGES.indexOf(status);
  return rows.map(({ key, label }) => {
    const stage = GENERATION_STAGES.indexOf(key);
    let state: StageRowState = "pending";
    if (status === "completed" || (current !== -1 && stage < current)) state = "done";
    else if (stage === current) state = "active";
    return { key, label, state };
  });
}
