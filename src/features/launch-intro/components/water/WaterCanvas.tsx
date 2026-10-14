import { memo, useCallback, useMemo } from "react";
import { PixelRatio, StyleSheet } from "react-native";
import { Canvas, createPicture, Picture } from "@shopify/react-native-skia";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { logger } from "@/core/monitoring/logger";
import { useTheme } from "@/theme";
import { waterFrameAt } from "../../logic/water/frame";
import type { WaterScene } from "../../logic/water/scene";
import { drawWaterFrame } from "./draw-water-frame";
import { makeWaterAssets } from "./water-assets";
import { dropsFilter } from "./water-filters";

export type WaterCanvasProps = {
  scene: WaterScene;
  /** Where the intro is, in ms: every frame is drawn from it alone. */
  time: SharedValue<number>;
  /** A frame couldn't be drawn: the intro steps aside rather than take the app down. */
  onFail: () => void;
  testID?: string;
};

/**
 * The water intro, drawn with Skia on the UI thread: each frame is worked out
 * from the time (`waterFrameAt`) and recorded as a picture, its water made
 * glass by shaders on the GPU, in the screen's own pixels. Its textures are
 * drawn once, as it mounts. It never re-renders while it plays: a re-render
 * would rebuild its drawing and could drop a frame, letting the page show through.
 */
export const WaterCanvas = memo(function WaterCanvas({
  scene,
  time,
  onFail,
  testID,
}: WaterCanvasProps) {
  const { launchInk } = useTheme().colors;
  const pr = PixelRatio.get();
  const assets = useMemo(
    () => makeWaterAssets(launchInk, pr, scene.stage),
    [launchInk, pr, scene.stage],
  );
  const drops = useMemo(() => dropsFilter(scene, assets, pr), [scene, assets, pr]);
  // Drawing runs on the UI thread, out of reach of React's error boundary
  // (`IntroFailSafe`): a frame that throws there would end the app, so it's caught
  // here, said in the log (the error's own words only), and the intro steps aside.
  const failed = useSharedValue(false);
  const fail = useCallback(
    (reason: string) => {
      logger.warn("Launch intro: a water frame couldn't be drawn", { reason });
      onFail();
    },
    [onFail],
  );

  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => {
        if (failed.get()) return;
        const t = time.get();
        try {
          drawWaterFrame(canvas, scene, waterFrameAt(scene, t), assets, drops, t, pr);
        } catch (error) {
          failed.set(true);
          runOnJS(fail)(error instanceof Error ? error.message : String(error));
        }
      }, scene.stage),
    [scene, assets, drops, pr, fail],
  );

  return (
    <Canvas testID={testID} style={StyleSheet.absoluteFill}>
      <Picture picture={picture} />
    </Canvas>
  );
});
