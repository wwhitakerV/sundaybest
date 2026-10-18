import { memo } from "react";
import type { SharedValue } from "react-native-reanimated";

import poolMovieAsset from "../../../../../assets/intro/pool-movie.mp4";
import type { Film } from "../../hooks/use-movie-clock";
import { POOL_MOVIE, poolMovieMoments } from "../../logic/movie/pool-movie";
import { FadingMovieIntroPlayer } from "./FadingMovieIntroPlayer";

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
 * (`npm run render:intro -- --film pool`, ADR 0029). On the red page it holds
 * on the full screen of water until the page is ready, then fades away over it.
 */
export const PoolMovieIntroPlayer = memo(function PoolMovieIntroPlayer(
  props: PoolMovieIntroPlayerProps,
) {
  return (
    <FadingMovieIntroPlayer
      testID="launch-intro-pool-movie"
      movie={POOL_MOVIE}
      film={FILM}
      {...props}
    />
  );
});
