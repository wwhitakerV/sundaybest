import type { Entity, Id, IsoDateTime } from "./common";
import type { PlanLength } from "./plan";

/**
 * Building a plan from a sermon, stage by stage — what Preparing shows.
 * `completed` and `failed` are the ends.
 */
export type PlanGenerationStatus =
  | "idle"
  | "validating"
  | "preparing"
  | "processingSermon"
  | "findingScripture"
  | "writingDays"
  | "buildingQuiz"
  | "completed"
  | "failed";

/** Why building a plan failed. */
export type PlanGenerationErrorCode =
  "invalidLink" | "unsupportedSource" | "videoUnavailable" | "noCaptions" | "network" | "unknown";

export type PlanGenerationError = {
  code: PlanGenerationErrorCode;
  message: string;
};

/** One run of building a plan from a pasted link, as New Plan asked for it. */
export type PlanGeneration = Entity & {
  userId: Id;
  /** The link as pasted. */
  sourceUrl: string;
  lengthDays: PlanLength;
  quickCheckEnabled: boolean;
  status: PlanGenerationStatus;
  /** The sermon, once found. */
  sermonId: Id | null;
  /** The plan being built, once created. */
  planId: Id | null;
  startedAt: IsoDateTime | null;
  finishedAt: IsoDateTime | null;
  /** Set only when `status` is `failed`. */
  error: PlanGenerationError | null;
};
