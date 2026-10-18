import { useEffect, useMemo } from "react";
import { Image } from "react-native";
import { useVideo } from "@shopify/react-native-skia";
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { dropFeedback, splashFeedback } from "@/core/haptics/haptics";
import { logger } from "@/core/monitoring/logger";
import { clockCrossings, type ClockMoments } from "../logic/clock";
import {
  beatAt,
  beatList,
  recordFrame,
  summarizeFrames,
  type FrameStats,
} from "../logic/frame-stats";
import { holdsFor } from "../logic/movie/movie";

/** How long the movie has to show its first frame before the intro steps aside to the page. */
const START_LIMIT_MS = 4000;

/** Development only (the logger is silent in production): how smoothly each beat played. */
function reportFrames(stats: FrameStats): void {
  logger.info("Launch intro: frame times by beat", { beats: summarizeFrames(stats).join(" | ") });
}

/** A film: its movie (an asset module), its beats, and the moments its clock acts on. */
export type Film = {
  asset: number;
  beats: Readonly<Record<string, { start: number; end: number }>>;
  moments: ClockMoments;
  /** Where the screen is full of water: the movie holds here until the page is ready. */
  holdStart: number;
  /** Called with the time of every frame on screen (a worklet), for anything that follows it. */
  follow?: (t: number) => void;
};

type MovieClockOptions = {
  revealed: SharedValue<number>;
  onReveal: () => void;
  onDone: () => void;
};

/**
 * A launch intro's movie, and its clock: the movie's own time, the time of the
 * frame on screen, drives everything. It holds on the full screen of water until
 * the page underneath is ready (`ready`, set by `IntroReadyBridge`), fires the
 * haptics on their frames, shows the page at the film's reveal, and ends at its
 * end. A movie that never shows a frame steps aside to the page.
 */
export function useMovieClock(film: Film, { revealed, onReveal, onDone }: MovieClockOptions) {
  const ready = useSharedValue(false);
  const paused = useSharedValue(false);
  const source = useMemo(() => Image.resolveAssetSource(film.asset).uri, [film.asset]);
  const { currentFrame, currentTime } = useVideo(source, { paused, looping: false, volume: 0 });
  // The time of the last frame acted on; −1 until the first is on screen.
  const shown = useSharedValue(-1);
  const measuring = __DEV__;
  const frames = useSharedValue<FrameStats>({});
  const beats = useMemo(() => beatList(film.beats), [film.beats]);
  const { moments, holdStart, follow } = film;

  useFrameCallback((frame) => {
    "worklet";
    if (!currentFrame.get()) return;
    const t = currentTime.get();
    paused.set(holdsFor(t, ready.get(), holdStart));
    const before = shown.get();
    shown.set(t);
    if (measuring) {
      const dt = frame.timeSincePreviousFrame ?? 0;
      frames.set(recordFrame(frames.get(), beatAt(beats, t), dt));
    }
    if (follow) follow(t);
    if (before < 0) return;
    const passed = clockCrossings(before, t, moments);
    if (passed.drop) runOnJS(dropFeedback)();
    if (passed.splash) runOnJS(splashFeedback)();
    if (passed.reveal) {
      revealed.set(1);
      runOnJS(onReveal)();
    }
    if (passed.done) {
      if (measuring) runOnJS(reportFrames)(frames.get());
      runOnJS(onDone)();
    }
  });

  // A movie that can't be played mustn't hold the app: a fail-safe, not timing.
  useEffect(() => {
    const id = setTimeout(() => {
      if (shown.get() < 0) onDone();
    }, START_LIMIT_MS);
    return () => clearTimeout(id);
  }, [shown, onDone]);

  return { currentFrame, currentTime, ready };
}
