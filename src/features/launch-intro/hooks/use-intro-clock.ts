import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { dropFeedback, splashFeedback } from "@/core/haptics/haptics";
import { logger } from "@/core/monitoring/logger";
import {
  advanceClock,
  canStart,
  clockCrossings,
  PREROLL_MS,
  smoothFrames,
  type ClockMoments,
} from "../logic/clock";
import { beatAt, recordFrame, summarizeFrames, type FrameStats } from "../logic/frame-stats";

/**
 * When things happen in an intro, for its clock: the moments it watches, where
 * it holds, and its beats (for the development log of how smoothly each played).
 */
export type IntroTiming = ClockMoments & {
  holdEnd: number;
  beats: readonly { key: string; start: number; end: number }[];
};

/** Development only (the logger is silent in production): how smoothly each beat played. */
function reportFrames(stats: FrameStats): void {
  logger.info("Launch intro: frame times by beat", { beats: summarizeFrames(stats).join(" | ") });
}

/**
 * The intro's clock, run on the UI thread one frame at a time. It starts once
 * the canvas is drawing (a few on-time frames in a row), from a blank beat
 * before the pen, and never jumps more than a frame at once. It waits at the
 * end of the full-colour hold until `ready` (set by `IntroReadyBridge`, so the
 * page becoming ready never re-renders the intro), and fires the haptics on
 * their beats (the letters reaching the pool; the eruption). Once it moves past
 * its reveal — never while it's waiting there — it shows the page underneath
 * (`revealed`), on the UI thread in that same frame, and calls `onReveal`; past
 * its end, `onDone`: the intro goes. (The pool intro's reveal is its end; the
 * water intro reveals the page as it drains, and ends once the water has gone.)
 */
export function useIntroClock(
  timing: IntroTiming,
  {
    revealed,
    onReveal,
    onDone,
  }: { revealed: SharedValue<number>; onReveal?: () => void; onDone: () => void },
): { time: SharedValue<number>; ready: SharedValue<boolean> } {
  // From a blank beat before the pen, so start-up's last hiccups land on the empty page.
  const time = useSharedValue(-PREROLL_MS);
  const ready = useSharedValue(false);
  // The clock starts once frames come on time (the canvas is drawing), or after a short wait.
  const smooth = useSharedValue(0);
  const waited = useSharedValue(0);
  // In development, every frame's time, by beat, logged once the intro is over.
  const measuring = __DEV__;
  const frames = useSharedValue<FrameStats>({});

  useFrameCallback((frame) => {
    "worklet";
    const dt = frame.timeSincePreviousFrame ?? 0;
    if (!canStart(smooth.get(), waited.get())) {
      smooth.set(smoothFrames(smooth.get(), dt));
      waited.set(waited.get() + dt);
      return;
    }
    const before = time.get();
    if (measuring) frames.set(recordFrame(frames.get(), beatAt(timing.beats, before), dt));
    const next = advanceClock(before, dt, { ready: ready.get(), holdEnd: timing.holdEnd });
    time.set(next);
    const passed = clockCrossings(before, next, timing);
    if (passed.drop) runOnJS(dropFeedback)();
    if (passed.splash) runOnJS(splashFeedback)();
    if (passed.reveal) {
      revealed.set(1);
      if (onReveal) runOnJS(onReveal)();
    }
    if (passed.done) {
      if (measuring) runOnJS(reportFrames)(frames.get());
      runOnJS(onDone)();
    }
  });

  return { time, ready };
}
