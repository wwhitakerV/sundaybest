import { useSyncExternalStore } from "react";

import type { BuildSubject } from "../hooks/use-generation-bar";
import type { GenerationBarView } from "../logic/generation-bar";

/**
 * DEVELOPMENT ONLY — remove once the generation bar and sheet are signed off.
 *
 * Every state the bar and its sheet can be in, to step through without
 * building a plan: `GenerationPreviewButton` cycles them, and while one is
 * set `useGenerationBar` shows it in place of the server's builds.
 */
type PreviewState = { label: string; view: GenerationBarView; subject: BuildSubject };

const SIX_DAYS = { lengthDays: 6, quickCheck: true } as const;

function building(label: string, status: BuildSubject["status"], percent: number): PreviewState {
  return {
    label,
    view: { kind: "building", id: "preview", percent, more: 0 },
    subject: { status, ...SIX_DAYS },
  };
}

export const PREVIEW_STATES: readonly PreviewState[] = [
  building("Listening 10%", "processingSermon", 10),
  building("Scripture 35%", "findingScripture", 35),
  building("Writing 62%", "writingDays", 62),
  building("Quiz 88%", "buildingQuiz", 88),
  {
    label: "Ready",
    view: { kind: "ready", id: "preview", planId: "preview", title: "In God We Trust" },
    subject: { status: "completed", ...SIX_DAYS },
  },
  {
    label: "Failed · retry",
    view: {
      kind: "failed",
      id: "preview",
      startKey: null,
      reason: "We couldn’t create this plan right now.\nPlease try again.",
      action: "retry",
    },
    subject: { status: "failed", ...SIX_DAYS },
  },
  {
    label: "Failed · new sermon",
    view: {
      kind: "failed",
      id: "preview",
      startKey: null,
      reason: "This video has no captions.\nWe need those to build your plan.",
      action: "chooseAnother",
    },
    subject: { status: "failed", ...SIX_DAYS },
  },
];

/** The state after `current`: the first from off, then each in turn, then off again. */
export function getNextPreviewIndex(current: number | null): number | null {
  if (current === null) return 0;
  return current + 1 < PREVIEW_STATES.length ? current + 1 : null;
}

let index: number | null = null;
const listeners = new Set<() => void>();

function setPreviewIndex(next: number | null) {
  index = next;
  for (const listener of listeners) listener();
}

/** Steps the preview on to its next state (or off, after the last). */
export function cyclePreview() {
  setPreviewIndex(getNextPreviewIndex(index));
}

/** Turns the preview off: the bar goes back to the server's builds. */
export function clearPreview() {
  setPreviewIndex(null);
}

/** The state being previewed, or null — always null outside development. */
export function useGenerationPreview(): PreviewState | null {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => index,
  );
  if (!__DEV__ || current === null) return null;
  return PREVIEW_STATES.at(current) ?? null;
}
