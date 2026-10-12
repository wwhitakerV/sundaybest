import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { dropFeedback, splashFeedback } from "@/core/haptics/haptics";
import { advanceClock, canStart, PREROLL_MS, smoothFrames } from "../logic/clock";
import type { Scene } from "../logic/scene";

/**
 * The intro's clock, run on the UI thread one frame at a time. It starts once
 * the canvas is drawing (a few on-time frames in a row), from a blank beat
 * before the pen, and never jumps more than a frame at once. It waits at the
 * end of the full-colour hold until `ready` (set by `IntroReadyBridge`, so the
 * page becoming ready never re-renders the intro), and fires the haptics on
 * their beats (the letters reaching the pool; the eruption). Once it moves past
 * the hold — never while it's waiting there — it shows the page underneath
 * (`revealed`), on the UI thread in that same frame, and calls `onDone`: the
 * intro goes and the page arrives.
 */
export function useIntroClock(
  scene: Scene,
  { revealed, onDone }: { revealed: SharedValue<number>; onDone: () => void },
): { time: SharedValue<number>; ready: SharedValue<boolean> } {
  // From a blank beat before the pen, so start-up's last hiccups land on the empty page.
  const time = useSharedValue(-PREROLL_MS);
  const ready = useSharedValue(false);
  // The clock starts once frames come on time (the canvas is drawing), or after a short wait.
  const smooth = useSharedValue(0);
  const waited = useSharedValue(0);

  const { beats } = scene;
  const firstHit = Math.min(...scene.world.falls.map((fall) => fall.hit));

  useFrameCallback((frame) => {
    "worklet";
    const dt = frame.timeSincePreviousFrame ?? 0;
    if (!canStart(smooth.get(), waited.get())) {
      smooth.set(smoothFrames(smooth.get(), dt));
      waited.set(waited.get() + dt);
      return;
    }
    const before = time.get();
    const next = advanceClock(before, dt, {
      ready: ready.get(),
      holdEnd: beats.hold.end,
    });
    time.set(next);
    const crossed = (at: number) => before < at && next >= at;
    if (crossed(firstHit)) runOnJS(dropFeedback)();
    if (crossed(beats.splash.start)) runOnJS(splashFeedback)();
    // Strictly past the hold: a clock waiting at its end for the page is still covering it.
    if (before <= beats.hold.end && next > beats.hold.end) {
      revealed.set(1);
      runOnJS(onDone)();
    }
  });

  return { time, ready };
}
