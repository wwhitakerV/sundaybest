import { useEffect, useState } from "react";

import type { StoryBeat, StoryPhase } from "../logic/story";

/** Where the story rests when it isn't playing: the stage, first card on it. */
const RESTING_PHASE: StoryPhase = { kind: "arrive" };

/**
 * Walks through `beats`, holding each for its `holdMs`, looping back to the
 * first after the last, and returns the current phase. Starts on mount.
 *
 * `paused` (Reduce Motion) holds the story still on its opening instead —
 * the story is decoration; the static list says the same. `frozen` (the
 * screen being left) holds it still wherever it is.
 */
export function useStoryPhase(
  beats: readonly StoryBeat[],
  paused: boolean,
  frozen = false,
): StoryPhase {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (paused || frozen) return;
    const holdMs = beats.at(index)?.holdMs;
    if (holdMs === undefined) return;
    const timeout = setTimeout(() => setIndex((previous) => (previous + 1) % beats.length), holdMs);
    return () => clearTimeout(timeout);
  }, [beats, index, paused, frozen]);

  if (paused) return RESTING_PHASE;
  return beats.at(index)?.phase ?? RESTING_PHASE;
}
