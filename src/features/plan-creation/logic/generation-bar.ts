import type { PlanGenerationStatus } from "@/types/domain";

/** A plan being built, or built, as the generation bar knows it. */
export type Build = {
  id: string;
  planId: string;
  title: string;
  status: PlanGenerationStatus;
  /** 0–100, from the server. */
  progress: number;
  lengthDays: number;
  quickCheck: boolean;
  error: { code: BuildErrorCode; message: string } | null;
};

type BuildErrorCode =
  "invalidLink" | "unsupportedSource" | "videoUnavailable" | "noCaptions" | "network" | "unknown";

/** A plan asked for that the server hasn't confirmed yet: still sending, or not sent. */
export type PendingStart = { key: string; failed: boolean };

/**
 * What the generation bar shows: the plan building and how far along; a plan
 * ready to open; or a failure, with what can be done about it. `more` counts
 * other plans still building.
 */
export type GenerationBarView =
  | { kind: "building"; id: string | null; percent: number; more: number }
  | { kind: "ready"; id: string; planId: string; title: string }
  | {
      kind: "failed";
      id: string | null;
      startKey: string | null;
      reason: string;
      action: "retry" | "chooseAnother";
    };

/** Failures no retry can fix: the sermon itself can't be built from. */
const UNBUILDABLE = new Set<BuildErrorCode>(["noCaptions", "unsupportedSource"]);

const START_FAILED = "We couldn’t start your plan.\nCheck your connection and try again.";

/**
 * Why a build failed, in the app's own words where it has them — each
 * sentence on its own line, so "Please try again." stands apart. Otherwise
 * the server's reason, set the same way.
 */
function failureReason(code: BuildErrorCode, message: string | undefined): string {
  switch (code) {
    case "noCaptions":
      return "This video has no captions.\nWe need those to build your plan.";
    case "unknown":
    case "network":
      return "We couldn’t create this plan right now.\nPlease try again.";
    default:
      return message
        ? message.replace(/([.!?])\s+/g, "$1\n")
        : "We couldn’t create this plan right now.\nPlease try again.";
  }
}

function isBuilding(build: Build): boolean {
  return build.status !== "completed" && build.status !== "failed";
}

/**
 * The bar for a reader's current builds (newest first, not yet dismissed) and
 * the plans they've just asked for: the newest of them all, or nothing.
 */
export function getGenerationBar(
  builds: readonly Build[],
  starts: readonly PendingStart[],
): GenerationBarView | null {
  const more = (shown: string | null) =>
    builds.filter((build) => build.id !== shown && isBuilding(build)).length;
  const start = starts.at(-1);
  if (start) {
    return start.failed
      ? { kind: "failed", id: null, startKey: start.key, reason: START_FAILED, action: "retry" }
      : { kind: "building", id: null, percent: 0, more: more(null) };
  }
  const newest = builds[0];
  if (!newest) return null;
  if (newest.status === "completed")
    return { kind: "ready", id: newest.id, planId: newest.planId, title: newest.title };
  if (newest.status === "failed") {
    const code = newest.error?.code ?? "unknown";
    return {
      kind: "failed",
      id: newest.id,
      startKey: null,
      reason: failureReason(code, newest.error?.message),
      action: UNBUILDABLE.has(code) ? "chooseAnother" : "retry",
    };
  }
  return { kind: "building", id: newest.id, percent: newest.progress, more: more(newest.id) };
}
