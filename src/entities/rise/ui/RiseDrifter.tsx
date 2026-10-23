import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import type { RiseGame } from "../logic/rise-rules";
import { drawRise } from "./draw-scene";
import { useRiseLook } from "./use-rise-look";

export type RiseDrifterProps = {
  /** The page's balloon as it stands (`useRiseDrifter`) — none until the page is laid out. */
  game: SharedValue<RiseGame | null>;
  /** It rose — the balloon green — or burst: red, and then paint. */
  verdict: "rose" | "burst";
  width: number;
  height: number;
  testID?: string;
};

/**
 * A page's living background, drawn behind its words: its balloon with the
 * answer on it, adrift, held or thrown — or the red one and the paint it
 * left. It only draws what it's given (`useRiseDrifter` moves it).
 */
export function RiseDrifter({ game, verdict, width, height, testID }: RiseDrifterProps) {
  const look = useRiseLook();
  // A burst one is red all the way: its "saved" colour is the red.
  const drawn = useMemo(
    () => (verdict === "rose" ? look : { ...look, green: look.red }),
    [look, verdict],
  );
  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
    const value = game.get();
    if (value) drawRise(canvas, value, drawn);
    return recorder.finishRecordingAsPicture();
  });

  return (
    <Canvas testID={testID} pointerEvents="none" style={{ width, height }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
