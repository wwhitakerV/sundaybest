import { useEffect, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  Easing,
  runOnJS,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { selectionFeedback } from "@/core/haptics/haptics";
import { TRACK_LAST, rubberBanded } from "../logic/formation-track";

/** How far a finger travels to move the track one station: a share of the screen's width — a firm, unhurried track. */
const STEP_SHARE = 0.65;
/** How far ahead a throw is projected (s), as iOS projects a scroll's end, and the least speed that always moves it on a station. */
const THROW = { projectS: 0.3, least: 0.6 };
/** The pull toward the station it's thrown to: critically damped, so it never overshoots. */
const PULL = { stiffness: 150, damping: 2 * Math.sqrt(150) };
/** The first open: the track draws in, bottom up, over this long. */
const DRAW_IN_MS = 1500;

/** What the track is doing: at rest, under a finger, or thrown. */
const REST = 0;
const DRAG = 1;
const THROWN = 2;

/**
 * vIdeal 2's track, moved by a finger anywhere on the page: progress in
 * stations (`shown`, the rubber-banded position everything is drawn at) and
 * the first open's draw-in (`drawIn`, 0…1). Dragged, it follows the finger
 * one to one, never catching. Thrown, it glides on its momentum — firm, a
 * station to every `STEP_SHARE` of the finger's travel — and eases onto the
 * station the throw reaches, never stopping on the way. Every station it
 * passes, either way, gives a selection haptic.
 */
export function useTrackMotion(width: number) {
  const reduceMotion = useReduceMotion();
  const step = width * STEP_SHARE;
  const raw = useSharedValue(0);
  const shown = useSharedValue(0);
  const speed = useSharedValue(0);
  const target = useSharedValue(0);
  const mode = useSharedValue(REST);
  const dragFrom = useSharedValue(0);
  const drawIn = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    drawIn.set(
      withTiming(1, {
        duration: reduceMotion ? 0 : DRAW_IN_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [drawIn, reduceMotion]);

  useFrameCallback((frame) => {
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);
    if (mode.get() === THROWN) {
      const pull = PULL.stiffness * (target.get() - raw.get()) - PULL.damping * speed.get();
      speed.set(speed.get() + pull * dt);
      raw.set(raw.get() + speed.get() * dt);
      if (Math.abs(target.get() - raw.get()) < 0.002 && Math.abs(speed.get()) < 0.05) {
        raw.set(target.get());
        speed.set(0);
        mode.set(REST);
      }
    }
    const before = shown.get();
    const next = rubberBanded(raw.get(), TRACK_LAST);
    // Passing a station, either way — onto it or past it, never in the stretch beyond the ends: the haptic.
    const passed =
      next > before
        ? Math.floor(Math.min(next, TRACK_LAST)) > Math.floor(Math.max(before, 0))
        : Math.ceil(Math.max(next, 0)) < Math.ceil(Math.min(before, TRACK_LAST));
    if (next !== before && passed) runOnJS(selectionFeedback)();
    shown.set(next);
  });

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-6, 6])
        .failOffsetX([-14, 14])
        .onBegin(() => {
          // A finger down catches the track where it is, as a scroll is caught.
          mode.set(DRAG);
          dragFrom.set(raw.get());
          speed.set(0);
        })
        .onUpdate((event) => {
          raw.set(dragFrom.get() - event.translationY / step);
        })
        .onEnd((event) => {
          const thrown = -event.velocityY / step;
          const from = Math.min(TRACK_LAST, Math.max(0, raw.get()));
          let to = Math.round(from + thrown * THROW.projectS);
          if (to === Math.round(from) && Math.abs(thrown) > THROW.least) to += Math.sign(thrown);
          target.set(Math.min(TRACK_LAST, Math.max(0, to)));
          speed.set(thrown);
          mode.set(THROWN);
        })
        .onFinalize(() => {
          // Never let go of: back to the nearest station.
          if (mode.get() !== DRAG) return;
          target.set(Math.min(TRACK_LAST, Math.max(0, Math.round(raw.get()))));
          mode.set(THROWN);
        }),
    [dragFrom, mode, raw, speed, step, target],
  );

  return { shown, drawIn, gesture };
}
