import type { ReactNode, RefObject } from "react";
import { StyleSheet, View } from "react-native";

import { BUILD_HEIGHT, BUILD_WIDTH, TOP_PAD } from "./fan-geometry";
import { PhoneCardBody } from "./PhoneCardBody";

export type StagePhoneProps = {
  /** The phone frame's root view — lift anchors measure against it. */
  frameRef: RefObject<View | null>;
  /** The screen(s) inside: the phone's own navigation. */
  children: ReactNode;
  testID?: string;
};

/**
 * The big phone in the middle of the stage. It never moves or scales — only
 * what's on its screen changes — so it is always sharp.
 */
export function StagePhone({ frameRef, children, testID }: StagePhoneProps) {
  return (
    <View testID={testID} pointerEvents="none" style={styles.stage}>
      <PhoneCardBody frameRef={frameRef}>{children}</PhoneCardBody>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: "absolute",
    top: TOP_PAD,
    left: "50%",
    marginLeft: -BUILD_WIDTH / 2,
    width: BUILD_WIDTH,
    height: BUILD_HEIGHT,
  },
});
