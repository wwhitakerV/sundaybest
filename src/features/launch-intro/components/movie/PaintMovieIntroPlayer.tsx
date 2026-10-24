import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { VideoView } from "expo-video";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/theme";
import paintMovieAsset from "../../../../../assets/intro/paint-movie.mp4";
import { useMovieClock, type Film } from "../../hooks/use-movie-clock";
import { fadeOpacity, movieMoments } from "../../logic/movie/movie";
import { PAINT_MOVIE } from "../../logic/movie/paint-movie";
import { IntroReadyBridge } from "../IntroReadyBridge";

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
 * (`npm run render:intro`, ADR 0030) by the phone's own video player (ADR
 * 0038): every frame already drawn, filling the screen. A white stroke across
 * the red page, the letters under it; the paint runs down into the pool and a
 * few drips follow; the letters fall in and the pool erupts to full white. The
 * launch's red covers the app until the movie's first frame is on screen; the
 * movie holds on the full white until the page is ready, then gives way to it
 * (at once: its fade is empty) while the page's pieces arrive.
 */
export const PaintMovieIntroPlayer = memo(function PaintMovieIntroPlayer({
  revealed,
  onReveal,
  onDone,
}: PaintMovieIntroPlayerProps) {
  const theme = useTheme();
  const { player, time, ready, onFirstFrame, shown } = useMovieClock(FILM, {
    revealed,
    onReveal,
    onDone,
  });
  const { hold, fade } = PAINT_MOVIE.beats;
  const page = useAnimatedStyle(() => ({ opacity: time.get() < hold.start ? 1 : 0 }));
  const fading = useAnimatedStyle(() => ({ opacity: fadeOpacity(time.get(), fade) }));

  return (
    <View
      testID="launch-intro-paint-movie"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        testID="launch-intro-page-colour"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.launchPage }, page]}
      />
      {/* Unseen until its first frame is drawn: never a black frame over the red. */}
      <Animated.View style={[StyleSheet.absoluteFill, fading, !shown && styles.unseen]}>
        <VideoView
          testID="launch-intro-video"
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          onFirstFrameRender={onFirstFrame}
        />
      </Animated.View>
      <IntroReadyBridge ready={ready} time={time} />
    </View>
  );
});

const styles = StyleSheet.create({
  unseen: { opacity: 0 },
});
