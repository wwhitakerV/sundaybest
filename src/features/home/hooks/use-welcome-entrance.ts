import { useContext, useEffect, useRef, useState } from "react";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { useSeenMoment } from "@/core/storage/moment-seen-queries";
import { motion } from "@/theme";
import { ArrivalContext } from "@/ui/arrival/arrival";
import { BUTTON_TURN_MS } from "../logic/welcome-timing";

/** Home's welcome, in order: nothing; the masthead; the kicker; the note typing; the button; all in place. */
export type WelcomePhase = "blank" | "masthead" | "kicker" | "typing" | "button" | "done";

const ORDER: readonly WelcomePhase[] = ["blank", "masthead", "kicker", "typing", "button", "done"];

const { welcome } = motion;

/**
 * How long each phase holds before the next — none for the typing, which ends
 * when its last letter is in (`typed`).
 */
const HOLD: Record<WelcomePhase, number | null> = {
  blank: welcome.blankMs,
  masthead: welcome.fadeMs + welcome.staggerMs,
  kicker: welcome.kickerMs + welcome.typeDelayMs,
  typing: null,
  // Long enough for the pill, its words and the link under it to be in place.
  button: BUTTON_TURN_MS,
  done: null,
};

/** Whether the welcome has got to `phase` yet. */
export function reached(current: WelcomePhase, phase: WelcomePhase): boolean {
  return ORDER.indexOf(current) >= ORDER.indexOf(phase);
}

/**
 * Home's welcome before a reader's first plan (`motion.welcome`): a blank
 * beat, the masthead rising in, the kicker, the note typing, then the button
 * assembling. It plays the first time only — recorded on the phone as it
 * starts — once the launch intro has gone; every time after, and under Reduce
 * Motion, everything is simply there. `ready` once the phone has said whether
 * it's been seen. A development build's preview can replay it.
 */
export function useWelcomeEntrance(onboarding: boolean) {
  const reduceMotion = useReduceMotion();
  const arrival = useContext(ArrivalContext);
  const { seen, markSeen } = useSeenMoment("welcome");
  // The latest, without restarting a phase's timer each time it's a new function.
  const mark = useRef(markSeen);
  useEffect(() => {
    mark.current = markSeen;
  });
  const [phase, setPhase] = useState<WelcomePhase>("blank");
  // Playing now — the first time, or replayed — though it's since been recorded as seen.
  const [playing, setPlaying] = useState(false);
  // Each replay is a fresh run: the page is drawn anew for it (its `key`).
  const [run, setRun] = useState(0);
  const settled = reduceMotion || (seen === true && !playing);

  useEffect(() => {
    const hold = HOLD[phase];
    const next = ORDER[ORDER.indexOf(phase) + 1];
    const waiting = !onboarding || arrival === "waiting" || seen === null;
    if (settled || waiting || hold === null || !next) return;
    const timer = setTimeout(() => {
      if (phase === "blank") {
        setPlaying(true);
        mark.current();
      }
      setPhase(next);
    }, hold);
    return () => clearTimeout(timer);
  }, [onboarding, arrival, seen, settled, phase]);

  return {
    phase: settled ? ("done" as const) : phase,
    ready: reduceMotion || seen !== null,
    run,
    /** The note's last letter is in: on to the button. */
    typed: () => setPhase((current) => (current === "typing" ? "button" : current)),
    /** Plays it again from the blank beat (development builds' preview). */
    replay: () => {
      setRun((current) => current + 1);
      setPlaying(true);
      setPhase("blank");
    },
  };
}
