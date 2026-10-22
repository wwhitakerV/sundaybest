import { useMemo } from "react";
import { View } from "react-native";
import { Canvas, Picture, Skia, useFont } from "@shopify/react-native-skia";

import { FONT_ASSETS, fonts } from "@/theme/fonts";
import { MARK, drawBurstMark, drawRoseMark } from "./draw-mark";
import { useRiseLook } from "./use-rise-look";

/** The mark's word, in the game's answer face, small. */
const LABEL_SIZE = 9;

export type RiseMarkProps = {
  /** How the question went: it rose (the wrong one crossed out), or it burst. */
  verdict: "rose" | "burst";
  /** How tall to draw it, in points: its own size unless smaller is asked for (a page's dot). */
  size?: number;
  testID?: string;
};

/**
 * How a question went, at a glance: a green balloon with ROSE on it, or a
 * black burst with BURST in it — drawn once, as the game draws them.
 */
export function RiseMark({ verdict, size = MARK.height, testID }: RiseMarkProps) {
  const look = useRiseLook();
  const font = useFont(FONT_ASSETS[fonts.uiSemibold], LABEL_SIZE);
  const picture = useMemo(() => {
    if (!font) return null;
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, MARK.width, MARK.height));
    if (verdict === "rose") drawRoseMark(canvas, look, font);
    else drawBurstMark(canvas, look, font);
    return recorder.finishRecordingAsPicture();
  }, [font, look, verdict]);

  const scale = size / MARK.height;
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={verdict === "rose" ? "Rose" : "Burst"}
      style={{ width: MARK.width * scale, height: size }}
    >
      <Canvas
        style={{
          width: MARK.width,
          height: MARK.height,
          // Drawn at its own size, scaled about its top left into the room asked for.
          transform: [
            { translateX: (MARK.width * (scale - 1)) / 2 },
            { translateY: (MARK.height * (scale - 1)) / 2 },
            { scale },
          ],
        }}
      >
        {picture && <Picture picture={picture} />}
      </Canvas>
    </View>
  );
}
