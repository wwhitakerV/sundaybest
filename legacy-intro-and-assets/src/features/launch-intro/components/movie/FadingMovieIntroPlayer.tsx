import { memo, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, createPicture, Picture } from "@shopify/react-native-skia";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useMovieClock, type Film } from "../../hooks/use-movie-clock";
import { coverFit } from "../../logic/movie/movie";
import { fadeOpacity } from "../../logic/movie/pool-movie";
import type { Stage } from "../../logic/settings";
import { IntroReadyBridge } from "../IntroReadyBridge";
import { drawWholeFrame } from "./draw-movie-frame";

type Beat = { start: number; end: number };

export type FadingMovieIntroPlayerProps = {
  testID: string;
  /** The movie's stage, and where its full-screen hold and its fade to the page fall. */
  movie: { stage: Stage; beats: { hold: Beat; fade: Beat } };
  film: Film;
  revealed: SharedValue<number>;
  /** The movie starts to fade: the page is shown under it. */
  onReveal: () => void;
  onDone: () => void;
};

/**
 * A launch intro played as a movie made from its prototype: every frame already
 * drawn, played by the phone's video hardware. The launch's page colour covers
 * the app until the movie fills the screen; the movie holds there until the page
 * is ready, then fades away over it (at once, if its fade is empty) while the
 * page's pieces arrive.
 */
export const FadingMovieIntroPlayer = memo(function FadingMovieIntroPlayer({
  testID,
  movie,
  film,
  revealed,
  onReveal,
  onDone,
}: FadingMovieIntroPlayerProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const screen = useMemo(() => ({ width, height }), [width, height]);
  const fit = useMemo(() => coverFit(movie.stage, screen), [movie.stage, screen]);
  const { currentFrame, currentTime, ready } = useMovieClock(film, { revealed, onReveal, onDone });
  const { hold, fade } = movie.beats;
  const page = useAnimatedStyle(() => ({ opacity: currentTime.get() < hold.start ? 1 : 0 }));
  const fading = useAnimatedStyle(() => ({ opacity: fadeOpacity(currentTime.get(), fade) }));
  const { stage } = movie;

  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => {
        const image = currentFrame.get();
        if (image) drawWholeFrame(canvas, image, stage, fit);
      }, screen),
    [fit, screen, stage],
  );

  return (
    <View testID={testID} style={StyleSheet.absoluteFill}>
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
