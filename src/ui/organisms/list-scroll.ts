import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/** Scroll events often enough to follow a finger, about once a frame. */
export const SCROLL_THROTTLE_MS = 16;

/** The list's scroll handler, when the page wants one. */
export const scrollProps = (onScroll?: (y: number) => void) =>
  onScroll
    ? {
        scrollEventThrottle: SCROLL_THROTTLE_MS,
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) =>
          onScroll(event.nativeEvent.contentOffset.y),
      }
    : {};
