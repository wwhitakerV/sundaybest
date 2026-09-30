import { useEffect, useRef, useState } from "react";
import {
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";

import { getCarouselIndex, getFolioGeometry } from "../logic/catalog";

/**
 * The exams page's carousel of subjects: which one is in view, the room it
 * has (measured — the books fill it), and the ways to move: a swipe (read
 * where it comes to rest), or `goTo`. `requested` is the subject the page
 * was asked to open on (from the subjects sheet); asked for again, it goes
 * to that one.
 */
export function useSubjectCarousel(count: number, requested: number | null) {
  const scrollRef = useRef<ScrollView>(null);
  // The window's width until it's been measured — it runs edge to edge — so the first frame isn't empty.
  const window = useWindowDimensions();
  const [room, setRoom] = useState({ width: window.width, height: 0 });
  const [index, setIndex] = useState(requested ?? 0);
  const [lastRequested, setLastRequested] = useState(requested);
  const geometry = getFolioGeometry(room.width);
  // Placed without motion until it's first been measured — only moves after that slide.
  const measured = useRef(false);

  if (requested !== lastRequested) {
    setLastRequested(requested);
    if (requested !== null) setIndex(requested);
  }

  // Keeps the native scroll position on the subject in view, however it was chosen.
  useEffect(() => {
    if (geometry.interval <= 0) return;
    scrollRef.current?.scrollTo({ x: index * geometry.interval, animated: measured.current });
    measured.current = true;
  }, [index, geometry.interval]);

  return {
    scrollRef,
    index,
    geometry,
    height: room.height,
    goTo: (next: number) => setIndex(Math.min(count - 1, Math.max(0, next))),
    onLayout: ({ nativeEvent }: LayoutChangeEvent) =>
      setRoom({ width: nativeEvent.layout.width, height: nativeEvent.layout.height }),
    onMomentumScrollEnd: ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) =>
      setIndex(getCarouselIndex(nativeEvent.contentOffset.x, geometry.interval, count)),
  };
}
