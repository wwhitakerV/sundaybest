import { useEffect, useState } from "react";
import { Keyboard, LayoutAnimation, useWindowDimensions, type KeyboardEvent } from "react-native";

/**
 * How far the keyboard covers the screen from its foot — 0 while it's away —
 * from the keyboard's own frame, not a view's measured place (which a modal
 * still fading in gets wrong). Each change lands on the keyboard's own curve,
 * so what sits on it rises and falls with it.
 */
export function useKeyboardOverlap(): number {
  const { height } = useWindowDimensions();
  const [top, setTop] = useState<number | null>(() => Keyboard.metrics()?.screenY ?? null);

  useEffect(() => {
    const move = ({ duration, endCoordinates }: KeyboardEvent) => {
      if (duration > 0) {
        LayoutAnimation.configureNext({
          duration,
          update: { duration, type: LayoutAnimation.Types.keyboard },
        });
      }
      setTop(endCoordinates.screenY);
    };
    const subscription = Keyboard.addListener("keyboardWillChangeFrame", move);
    // Up already, if it rose before this listened.
    const metrics = Keyboard.metrics();
    if (metrics) setTop(metrics.screenY);
    return () => subscription.remove();
  }, []);

  return top === null ? 0 : Math.max(height - top, 0);
}
