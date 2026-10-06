import type { PlanGenerationStatus } from "@/types/domain";
import { GENERATION_STAGES } from "@/core/store";
import { formatPlanLength } from "@/entities/plan";

/** A step of a plan's build: done, being worked on, or still to come. */
type BuildStepState = "done" | "active" | "pending";

export type BuildStep = {
  key: PlanGenerationStatus;
  label: string;
  /** What the step does, until it's done — then what it accomplished. */
  detail: string;
  state: BuildStepState;
};

/**
 * A build's steps at `status`: listening to the message, finding the
 * Scripture, writing the days, and — with a Quick Check — building the quiz.
 * Steps before the current one are done and the current one is active; a plan
 * just asked for (validating, preparing) is already on the first.
 */
export function getBuildSteps(
  status: PlanGenerationStatus,
  lengthDays: number,
  quickCheckEnabled: boolean,
): BuildStep[] {
  const days = formatPlanLength(lengthDays);
  const rows: { key: PlanGenerationStatus; label: string; doing: string; did: string }[] = [
    {
      key: "processingSermon",
      label: "Listening to the message",
      doing: "Reading the whole message, start to finish.",
      did: "Heard the whole message.",
    },
    {
      key: "findingScripture",
      label: "Finding the Scripture",
      doing: "Finding the passages the sermon is built on.",
      did: "Found the passages it’s built on.",
    },
    {
      key: "writingDays",
      label: `Writing your ${days}`,
      doing: "Readings, reflections, and prayers.",
      did: `Wrote your ${days}.`,
    },
    ...(quickCheckEnabled
      ? [
          {
            key: "buildingQuiz" as const,
            label: "Building your quiz",
            doing: "Writing questions on what matters most.",
            did: "Built your quiz.",
          },
        ]
      : []),
  ];
  const asked = status === "validating" || status === "preparing";
  const current = GENERATION_STAGES.indexOf(asked ? "processingSermon" : status);
  return rows.map(({ key, label, doing, did }) => {
    const stage = GENERATION_STAGES.indexOf(key);
    let state: BuildStepState = "pending";
    if (status === "completed" || (current !== -1 && stage < current)) state = "done";
    else if (stage === current) state = "active";
    return { key, label, detail: state === "done" ? did : doing, state };
  });
}
