import { memo, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, createPicture, Picture } from "@shopify/react-native-skia";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import movieAsset from "../../../../../assets/intro/water-intro.mp4";
import { useMovieClock, type Film } from "../../hooks/use-movie-clock";
import { coverFit, MOVIE } from "../../logic/movie/movie";
import { uncoveredTo } from "../../logic/water/drain";
import { buildWaterScene } from "../../logic/water/scene";
import { IntroReadyBridge } from "../IntroReadyBridge";
import { drawMovieFrame, makeMovieAssets } from "./draw-movie-frame";

export type MovieIntroPlayerProps = {
  revealed: SharedValue<number>;
  /** How far down the drain has uncovered the page, for its pieces to arrive by (`Arrive`). */
  uncovered: SharedValue<number>;
  /** The water starts to drain: the page is shown under it. */
  onReveal: () => void;
  onDone: () => void;
};

/**
 * The water intro, played as a movie made from its prototype
 * (`npm run render:intro`): every frame already drawn, played by the phone's
 * video hardware, so it's as smooth and as light as a video is. The launch's
 * page colour covers the app until the screen is full of water; the movie holds
 * there until the page is ready, then drains away over it, the page showing
 * wherever the water has gone. Nothing outside it re-renders it while it plays.
 */
export const MovieIntroPlayer = memo(function MovieIntroPlayer({
  revealed,
  uncovered,
  onReveal,
  onDone,
}: MovieIntroPlayerProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  // The movie's own moments, worked out from the settings it was made with on its own stage.
  const scene = useMemo(() => buildWaterScene(MOVIE.settings, MOVIE.stage), []);
  const screen = useMemo(() => ({ width, height }), [width, height]);
  const fit = useMemo(() => coverFit(MOVIE.stage, screen), [screen]);
  const assets = useMemo(() => makeMovieAssets(), []);
  const film = useMemo<Film>(
    () => ({
      asset: movieAsset,
      beats: scene.beats,
      moments: {
        firstHit: Math.min(...scene.world.falls.map((fall) => fall.hit)),
        splashStart: scene.beats.splash.start,
        revealAt: scene.revealAt,
        doneAt: scene.total,
      },
      holdStart: scene.beats.hold.start,
      // The drain's edge, down the screen, for the page's pieces to arrive by.
      follow: (t: number) => {
        "worklet";
        if (t >= scene.revealAt) uncovered.set(fit.dy + uncoveredTo(scene, t) * fit.scale);
      },
    }),
    [scene, fit, uncovered],
  );
  const { currentFrame, currentTime, ready } = useMovieClock(film, { revealed, onReveal, onDone });
  const full = scene.beats.hold.start;
  const page = useAnimatedStyle(() => ({ opacity: currentTime.get() < full ? 1 : 0 }));

  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => {
        const image = currentFrame.get();
        if (image) drawMovieFrame(canvas, image, currentTime.get(), scene, fit, assets);
      }, screen),
    [scene, fit, assets, screen],
  );

  return (
    <View testID="launch-intro-movie" style={StyleSheet.absoluteFill}>
      <Animated.View
        testID="launch-intro-white"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }, page]}
      />
      <Canvas testID="launch-intro-canvas" style={StyleSheet.absoluteFill}>
        <Picture picture={picture} />
      </Canvas>
      <IntroReadyBridge ready={ready} time={currentTime} />
    </View>
  );
});
