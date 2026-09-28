import { useRef, useState } from "react";
import type { LayoutChangeEvent, ScrollView } from "react-native";

import { getCategoryView, type FunCategory } from "../logic/categories";

/**
 * The category Fun is showing, and the page following it: picking one
 * narrows Play now to its games and brings its part of the page into view —
 * the top for Quick Play, or the chip row with Play now just under it for the
 * rest. Attach `scrollRef` to the page and `onRailLayout` to the chip row.
 */
export function useCategoryScroll() {
  const [category, setCategory] = useState<FunCategory>("Quick Play");
  const scrollRef = useRef<ScrollView>(null);
  const railTop = useRef(0);

  const select = (next: FunCategory) => {
    setCategory(next);
    const y = getCategoryView(next).section === "play-now" ? railTop.current : 0;
    scrollRef.current?.scrollTo({ y, animated: false });
  };

  const onRailLayout = (event: LayoutChangeEvent) => {
    railTop.current = event.nativeEvent.layout.y;
  };

  return { category, games: getCategoryView(category).games, select, scrollRef, onRailLayout };
}
