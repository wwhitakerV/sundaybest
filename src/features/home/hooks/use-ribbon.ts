import { useEffect, useRef } from "react";
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { typingFeedback } from "@/core/haptics/haptics";
import { motion } from "@/theme";
import { RIBBON_WINDOW, ribbonSlots } from "../logic/ribbon";

const { welcome } = motion;

/** The breath between paragraphs, in letters' beats. */
const PAUSE_SLOTS = Math.round(welcome.paragraphPauseMs / welcome.letterMs);

/**
 * The paragraphs writing themselves out as a ribbon once `start`: a slot every
 * `letterMs`, each letter landing over the next few (`ribbonLanding`). One
 * clock — `progress`, on the UI thread — drives every letter and the haptics:
 * as it crosses into a letter (not a space) that letter ticks, so the ticks
 * never drift from what's seen. `onDone` once the last letter has started;
 * `starts` is each paragraph's first slot. `instant`: all simply there.
 */
export function useRibbon(
  paragraphs: readonly string[],
  { start, instant, onDone }: { start: boolean; instant: boolean; onDone: () => void },
) {
  const slots = ribbonSlots(paragraphs, PAUSE_SLOTS);
  const progress = useSharedValue(instant ? slots.total + RIBBON_WINDOW : 0);
  // The latest of each, for the clock's callback — without restarting the ribbon.
  const latest = useRef({ slots, onDone, finished: false });
  useEffect(() => {
    latest.current.slots = slots;
    latest.current.onDone = onDone;
  });

  useEffect(() => {
    if (!start || instant) return;
    const end = ribbonSlots(paragraphs, PAUSE_SLOTS).total + RIBBON_WINDOW;
    progress.set(withTiming(end, { duration: end * welcome.letterMs, easing: Easing.linear }));
  }, [paragraphs, start, instant, progress]);

  // Slots the clock passed over since the last frame: one tick if any of them
  // is a letter, and done once it's past the last.
  const crossed = (from: number, to: number) => {
    const { slots: current, onDone: done, finished } = latest.current;
    for (let slot = from; slot < to; slot += 1) {
      if (current.letterAt[slot]?.trim()) {
        typingFeedback();
        break;
      }
    }
    if (!finished && to >= current.total) {
      latest.current.finished = true;
      done();
    }
  };

  useAnimatedReaction(
    () => Math.floor(progress.get()),
    (slot, previous) => {
      if (previous === null || slot <= previous) return;
      runOnJS(crossed)(previous, slot);
    },
  );

  return { progress, starts: slots.starts };
}
