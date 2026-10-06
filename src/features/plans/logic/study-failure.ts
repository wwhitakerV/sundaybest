import { isApiError } from "@/core/api/api-error";

/**
 * Why a study screen has nothing to show: its day isn't open yet, it (or its
 * plan) isn't there, or the server couldn't be reached.
 */
export type StudyFailure = "locked" | "missing" | "unreachable";

/** Only a failure to reach the server is worth trying again; the rest are answers. */
export function classifyStudyFailure(error: unknown): StudyFailure {
  if (!error) return "missing";
  if (!isApiError(error)) return "unreachable";
  switch (error.code) {
    case "DAY_LOCKED":
    case "STUDY_INCOMPLETE":
    case "QUICK_CHECK_REQUIRED":
      return "locked";
    case "NOT_FOUND":
    case "FORBIDDEN":
    case "PLAN_NOT_READY":
      return "missing";
    default:
      return "unreachable";
  }
}
