import { memo, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, createPicture, Picture } from "@shopify/react-native-skia";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import paintMovieAsset from "../../../../../assets/intro/paint-movie.mp4";
import { useMovieClock, type Film } from "../../hooks/use-movie-clock";
import { coverFit, fadeOpacity, movieMoments } from "../../logic/movie/movie";
import { PAINT_MOVIE } from "../../logic/movie/paint-movie";
import { IntroReadyBridge } from "../IntroReadyBridge";
import { drawWholeFrame } from "./draw-movie-frame";

export type PaintMovieIntroPlayerProps = {
  revealed: SharedValue<number>;
  /** The white hands over: the page is shown under it. */
  onReveal: () => void;
  onDone: () => void;
};

const FILM: Film = {
  asset: paintMovieAsset,
  beats: PAINT_MOVIE.beats,
  moments: movieMoments(PAINT_MOVIE),
  holdStart: PAINT_MOVIE.beats.hold.start,
};

/**
 * The paint intro, played as a movie made from its prototype
 * (`npm run render:intro`, ADR 0030): every frame already drawn, played by the
 * phone's video hardware. A white stroke across the red page, the letters under
 * it; the paint runs down into the pool and a few drips follow; the letters fall
 * in and the pool erupts to full white. The launch's red covers the app until
 * then; the movie holds on the full white until the page is ready, then gives way
 * to it (at once: its fade is empty) while the page's pieces arrive.
 */
export const PaintMovieIntroPlayer = memo(function PaintMovieIntroPlayer({
  revealed,
  onReveal,
  onDone,
}: PaintMovieIntroPlayerProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const screen = useMemo(() => ({ width, height }), [width, height]);
  const fit = useMemo(() => coverFit(PAINT_MOVIE.stage, screen), [screen]);
  const { currentFrame, currentTime, ready } = useMovieClock(FILM, { revealed, onReveal, onDone });
  const { hold, fade } = PAINT_MOVIE.beats;
  const page = useAnimatedStyle(() => ({ opacity: currentTime.get() < hold.start ? 1 : 0 }));
  const fading = useAnimatedStyle(() => ({ opacity: fadeOpacity(currentTime.get(), fade) }));

  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => {
        const image = currentFrame.get();
        if (image) drawWholeFrame(canvas, image, PAINT_MOVIE.stage, fit);
      }, screen),
    [fit, screen],
  );

  return (
    <View testID="launch-intro-paint-movie" style={StyleSheet.absoluteFill}>
      <Animated.View
        testID="launch-intro-page-colour"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }, page]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, fading]}>
        <Canvas testID="launch-intro-canvas" style={StyleSheet.absoluteFill}>
          <Picture picture={picture} />
        </Canvas>
      </Animated.View>
      <IntroReadyBridge ready={ready} time={currentTime} />
    </View>
  );
});
