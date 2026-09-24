import type { ReactNode, RefObject } from "react";
import { StyleSheet, View } from "react-native";

import { PHONE_FRAME, PhoneFrame } from "@/ui/PhoneFrame";
import { ScaledView } from "@/ui/ScaledView";
import { useTheme } from "@/theme";
import { BUILD_RADIUS, BUILD_WIDTH } from "./fan-geometry";

export type PhoneCardBodyProps = {
  /** The mock screen inside the phone. */
  children: ReactNode;
  /** The phone frame's root view — lift anchors measure against it. */
  frameRef?: RefObject<View | null>;
};

/**
 * A phone as the Welcome stage draws it at full stage size: the device, its
 * shadow, and a mock screen inside. The big phone and the small ones behind
 * it all draw this. Fills its parent.
 */
export function PhoneCardBody({ children, frameRef }: PhoneCardBodyProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.body,
        { backgroundColor: theme.colors.deviceFrame, shadowColor: theme.colors.shadow },
        theme.elevation.card,
      ]}
    >
      <ScaledView
        designWidth={PHONE_FRAME.width}
        designHeight={PHONE_FRAME.height}
        width={BUILD_WIDTH}
      >
        {/* Not collapsable: lift anchors measure against it. */}
        <View ref={frameRef} collapsable={false}>
          <PhoneFrame>{children}</PhoneFrame>
        </View>
      </ScaledView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { ...StyleSheet.absoluteFill, borderRadius: BUILD_RADIUS },
});
