import { useContext, useRef, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { LiftAnchorContext } from "./lift-anchor-context";

export type LiftAnchorProps = {
  /** Which piece this is — `getLiftId(turn, index)`. */
  id: string;
  children: ReactNode;
};

/**
 * Marks a piece of a mock screen that lifts off the phone on its turn.
 * Reports where the piece sits in the mock (measured, so it stays right if
 * the mock's layout changes) and hides it while its foreground copy is up.
 * Outside the big phone it's just a plain wrapper.
 */
export function LiftAnchor({ id, children }: LiftAnchorProps) {
  const context = useContext(LiftAnchorContext);
  const ref = useRef<View>(null);

  function measure() {
    const frame = context?.frameRef.current;
    const self = ref.current;
    if (!context || !frame || !self) return;
    self.measureLayout(frame, (x, y, width, height) => {
      context.onAnchor(id, { x, y, width, height });
    });
  }

  return (
    // Not collapsable: it must exist natively to be measured.
    <View
      ref={ref}
      collapsable={false}
      onLayout={measure}
      style={context?.hiddenId === id ? styles.hidden : undefined}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { opacity: 0 },
});
