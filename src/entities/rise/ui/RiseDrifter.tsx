import { useMemo, useState } from "react";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";

import { drawRise } from "./draw-scene";
import { drifterGame, settleDrifter, stepDrifter } from "./drifter";
import { useRiseLook } from "./use-rise-look";

export type RiseDrifterProps = {
  /** How the question went: it rose — a saved balloon, green — or it burst, red and then paint. */
  verdict: "rose" | "burst";
  /** What's on the balloon: the answer — and, beneath it, the time it kept ("+1.5s"), when it rose. */
  label: string;
  note: string | null;
  width: number;
  height: number;
  /** Reduce Motion: the balloon still, the burst already landed. */
  still: boolean;
  /** Told the moment it bursts — for its knock. */
  onBurst?: () => void;
  testID?: string;
};

/**
 * A page's living background, `width` by `height`, drawn behind its words:
 * from the moment it mounts, a balloon with the answer on it drifts across
 * the page — or a red one drifts a moment, then bursts where it is, its
 * paint landing behind the words. Mount it again (a new key) to play again.
 */
export function RiseDrifter({
  verdict,
  label,
  note,
  width,
  height,
  still,
  onBurst,
  testID,
}: RiseDrifterProps) {
  const rose = verdict === "rose";
  const look = useRiseLook();
  // A burst one is red all the way: its "saved" colour is the red.
  const drawn = useMemo(() => (rose ? look : { ...look, green: look.red }), [look, rose]);
  const [start] = useState(() => {
    const game = drifterGame(width, height, label, note);
    if (still) settleDrifter(game, rose);
    return game;
  });
  const game = useSharedValue(start);
  const ms = useSharedValue(0);

  useFrameCallback((frame) => {
    const step = Math.min(34, frame.timeSincePreviousFrame ?? 0);
    ms.set(ms.get() + step);
    game.modify((value) => {
      "worklet";
      if (stepDrifter(value, rose, ms.get(), step) && onBurst) runOnJS(onBurst)();
      return value;
    });
  }, !still);

  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
    drawRise(canvas, game.get(), drawn);
    return recorder.finishRecordingAsPicture();
  });

  return (
    <Canvas testID={testID} pointerEvents="none" style={{ width, height }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
