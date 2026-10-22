import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import type { RiseGame } from "../logic/rise-rules";
import { drawRise } from "./draw-scene";
import { useRiseLook } from "./use-rise-look";

export type RiseBoardProps = {
  /** The game as it stands, stepped elsewhere (`advanceRise`). */
  game: SharedValue<RiseGame>;
  width: number;
  height: number;
  /** Told, once, if drawing fails on the UI thread — where an error thrown would abort the app. */
  onError?: (where: string, message: string) => void;
  testID?: string;
};

/**
 * RISE's board, drawn on white each frame from the game as it stands: the
 * balloons glossy red, crossed out in white, saved ones green; black paint
 * and torn latex where they burst, kept. It only draws what it's given; it
 * never moves anything. Everything's drawn in one picture (`drawRise`).
 */
export function RiseBoard({ game, width, height, onError, testID }: RiseBoardProps) {
  const look = useRiseLook();
  const failed = useSharedValue(false);
  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
    if (!failed.get()) {
      try {
        drawRise(canvas, game.get(), look);
      } catch (error) {
        failed.set(true);
        if (onError) runOnJS(onError)("draw", String(error));
      }
    }
    return recorder.finishRecordingAsPicture();
  });

  return (
    <Canvas testID={testID} style={{ width, height }} pointerEvents="none">
      <Picture picture={picture} />
    </Canvas>
  );
}
