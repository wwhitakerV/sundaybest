import { memo, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, createPicture, Picture } from "@shopify/react-native-skia";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import poolMovieAsset from "../../../../../assets/intro/pool-movie.mp4";
import { useMovieClock, type Film } from "../../hooks/use-movie-clock";
import { coverFit } from "../../logic/movie/movie";
import { fadeOpacity, POOL_MOVIE, poolMovieMoments } from "../../logic/movie/pool-movie";
import { IntroReadyBridge } from "../IntroReadyBridge";
import { drawWholeFrame } from "./draw-movie-frame";

export type PoolMovieIntroPlayerProps = {
  revealed: SharedValue<number>;
  /** The water starts to fade: the page is shown under it. */
  onReveal: () => void;
  onDone: () => void;
};

const FILM: Film = {
  asset: poolMovieAsset,
  beats: POOL_MOVIE.beats,
  moments: poolMovieMoments(POOL_MOVIE),
  holdStart: POOL_MOVIE.beats.hold.start,
};

/**
 * The pool intro in water, played as a movie made from its prototype
 * (`npm run render:intro`, ADR 0029): every frame already drawn, played by the
 * phone's video hardware. The launch's red page covers the app until the screen
 * is full of water; the movie holds there until the page is ready, then fades
 * away over it while the page's pieces arrive.
 */
export const PoolMovieIntroPlayer = memo(function PoolMovieIntroPlayer({
  revealed,
  onReveal,
  onDone,
}: PoolMovieIntroPlayerProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const screen = useMemo(() => ({ width, height }), [width, height]);
  const fit = useMemo(() => coverFit(POOL_MOVIE.stage, screen), [screen]);
  const { currentFrame, currentTime, ready } = useMovieClock(FILM, { revealed, onReveal, onDone });
  const { hold, fade } = POOL_MOVIE.beats;
  const page = useAnimatedStyle(() => ({ opacity: currentTime.get() < hold.start ? 1 : 0 }));
  const fading = useAnimatedStyle(() => ({ opacity: fadeOpacity(currentTime.get(), fade) }));

  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => {
        const image = currentFrame.get();
        if (image) drawWholeFrame(canvas, image, POOL_MOVIE.stage, fit);
      }, screen),
    [fit, screen],
  );

  return (
    <View testID="launch-intro-pool-movie" style={StyleSheet.absoluteFill}>
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
