import { useEffect, type RefObject } from "react";

type Scroller = { scrollToEnd: (options?: { animated?: boolean }) => void };

/**
 * Scrolls a scroller all the way down, animated, each time `trigger` is set
 * or changes (`null` leaves it be). It waits a frame, so the content that
 * set it — a verdict's room at the foot — is laid out before it scrolls.
 */
export function useScrollToEnd(scroller: RefObject<Scroller | null>, trigger: number | null) {
  useEffect(() => {
    if (trigger === null) return;
    const frame = requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
    return () => cancelAnimationFrame(frame);
  }, [scroller, trigger]);
}
