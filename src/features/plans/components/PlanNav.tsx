import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { ArrowLeft, Ellipsis } from "lucide-react-native";

import { PAGE_INSET } from "@/ui/organisms/Screen";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";

export type PlanNavProps = {
  testIDs: { root: string; header: string; back: string; more: string };
  /** Whether it's the look showing — only then does it take touches, or get read by VoiceOver. */
  shown: boolean;
  /** Set for the sermon's colour behind it; the page's own look when left out. */
  overlay?: "light" | "dark";
  /** How far down the screen it sits. */
  top: number;
  /** Its cross-fade with the other look. */
  style: StyleProp<AnimatedStyle<ViewStyle>>;
  onBack: () => void;
};

/**
 * Plan Detail's Back and More, floating over the page, fixed: they never
 * move as the page scrolls under them.
 */
export function PlanNav({ testIDs, shown, overlay, top, style, onBack }: PlanNavProps) {
  return (
    <Animated.View
      testID={testIDs.root}
      pointerEvents={shown ? "box-none" : "none"}
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? "auto" : "no-hide-descendants"}
      style={[styles.nav, { paddingTop: top }, style]}
    >
      <ScreenHeader
        testID={testIDs.header}
        title=""
        left={
          <HeaderIconButton
            testID={testIDs.back}
            icon={ArrowLeft}
            accessibilityLabel="Back"
            {...(overlay && { overlay })}
            onPress={onBack}
          />
        }
        right={
          <HeaderIconButton
            testID={testIDs.more}
            icon={Ellipsis}
            accessibilityLabel="More"
            {...(overlay && { overlay })}
            onPress={() => undefined}
          />
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  nav: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: PAGE_INSET },
});
