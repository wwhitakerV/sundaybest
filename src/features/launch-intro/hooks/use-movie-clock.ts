import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEventListener } from "expo";
import { useVideoPlayer } from "expo-video";
import {
  runOnJS,
  useAnimatedReaction,
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
/** How often the player says where it is, in seconds: every frame of a 60 Hz screen. */
const TICK_S = 1 / 60;

/** Development only (the logger is silent in production): how smoothly each beat played. */
function reportFrames(stats: FrameStats): void {
  logger.info("Launch intro: frame times by beat", { beats: summarizeFrames(stats).join(" | ") });
}

/** A film: its movie (an asset module), its beats, and the moments its clock acts on. */
export type Film = {
  asset: number;
  beats: Readonly<Record<string, { start: number; end: number }>>;
  moments: ClockMoments;
  /** Where the screen is full white: the movie holds here until the page is ready. */
  holdStart: number;
};

type MovieClockOptions = {
  revealed: SharedValue<number>;
  onReveal: () => void;
  onDone: () => void;
};

/**
 * A launch intro's movie, played by the phone's own video player
 * (`expo-video`) — muted, mixing with whatever else is playing, so it never
 * stops the reader's music — and its clock: the movie's own time drives
 * everything. It holds on the full white screen until the page underneath is
 * ready (`ready`, set by `IntroReadyBridge`), fires the haptics on their
 * moments, shows the page at the film's reveal, and ends at its end. It never
 * holds the app: a movie that shows no frame in time, fails, or ends early
 * steps aside to the page.
 */
export function useMovieClock(film: Film, { revealed, onReveal, onDone }: MovieClockOptions) {
  const ready = useSharedValue(false);
  // The movie's time, in milliseconds: what the page's colour and the fade follow.
  const time = useSharedValue(0);
  const [shown, setShown] = useState(false);
  const player = useVideoPlayer(film.asset, (movie) => {
    movie.muted = true;
    movie.audioMixingMode = "mixWithOthers";
    movie.loop = false;
    movie.timeUpdateEventInterval = TICK_S;
    movie.play();
  });
  // The time of the last moment acted on; −1 until the first.
  const last = useRef(-1);
  const held = useRef(false);
  const ended = useRef(false);
  const handlers = useRef({ onReveal, onDone });
  useEffect(() => {
    handlers.current = { onReveal, onDone };
  });
  const measuring = __DEV__;
  const frames = useSharedValue<FrameStats>({});
  const beats = useMemo(() => beatList(film.beats), [film.beats]);
  const { moments, holdStart } = film;

  const end = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    if (measuring) reportFrames(frames.get());
    handlers.current.onDone();
  }, [frames, measuring]);

  function step(t: number) {
    time.set(t);
    if (!held.current && holdsFor(t, ready.get(), holdStart)) {
      held.current = true;
      player.pause();
    }
    const before = last.current;
    last.current = t;
    if (before < 0) return;
    const passed = clockCrossings(before, t, moments);
    if (passed.drop) dropFeedback();
    if (passed.splash) splashFeedback();
    if (passed.reveal) {
      revealed.set(1);
      handlers.current.onReveal();
    }
    if (passed.done) end();
  }

  // The page is ready while the movie waits on the white: it plays on.
  function resume() {
    if (!held.current) return;
    held.current = false;
    player.play();
  }

  useEventListener(player, "timeUpdate", ({ currentTime }) => step(currentTime * 1000));
  useEventListener(player, "playToEnd", end);
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") end();
  });
  useAnimatedReaction(
    () => ready.get(),
    (now) => {
      if (now) runOnJS(resume)();
    },
  );

  // Development only: how smoothly the screen kept up with each beat.
  useFrameCallback((frame) => {
    "worklet";
    if (!measuring) return;
    const dt = frame.timeSincePreviousFrame ?? 0;
    frames.set(recordFrame(frames.get(), beatAt(beats, time.get()), dt));
  });

  // A movie that can't be shown mustn't hold the app: a fail-safe, not timing.
  useEffect(() => {
    if (shown) return;
    const id = setTimeout(end, START_LIMIT_MS);
    return () => clearTimeout(id);
  }, [shown, end]);

  return { player, time, ready, onFirstFrame: () => setShown(true), shown };
}
