import { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import { Canvas, createPicture, Picture } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/theme";
import { frameAt } from "../logic/frame";
import type { Scene } from "../logic/scene";
import { drawFrame } from "./draw-frame";
import { makeIntroAssets } from "./intro-assets";

export type IntroCanvasProps = {
  scene: Scene;
  /** Where the intro is, in ms: every frame is drawn from it alone. */
  time: SharedValue<number>;
  testID?: string;
};

/**
 * The intro, drawn with Skia on the UI thread: each frame is worked out from the
 * time (`frameAt`) and recorded as a picture, so nothing the app does while it
 * loads underneath can make it stutter. It never re-renders while it plays: a
 * re-render would rebuild its drawing and could drop a frame, letting the page
 * underneath show through.
 */
export const IntroCanvas = memo(function IntroCanvas({ scene, time, testID }: IntroCanvasProps) {
  const theme = useTheme();
  const { launchInk } = theme.colors;
  const assets = useMemo(() => makeIntroAssets(launchInk), [launchInk]);

  const picture = useDerivedValue(
    () =>
      createPicture(
        (canvas) => drawFrame(canvas, scene, frameAt(scene, time.get()), assets),
        scene.stage,
      ),
    [scene, assets],
  );

  return (
    <Canvas testID={testID} style={StyleSheet.absoluteFill}>
      <Picture picture={picture} />
    </Canvas>
  );
});
