import { StyleSheet, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { controlHeight, space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ContentPending } from "@/ui/molecules/ContentPending";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";

export type PlanOverviewPendingProps = {
  /** Where the floating nav sits below the safe area. */
  navTop: number;
  onBack: () => void;
};

/** Plan Overview while its plan loads: the way back, over a pending body. */
export function PlanOverviewPending({ navTop, onBack }: PlanOverviewPendingProps) {
  return (
    <Screen testID="plan-overview-screen" edges={["left", "right"]}>
      <View style={[styles.nav, { top: navTop }]}>
        <ScreenHeader
          testID="plan-overview-loading-header"
          title=""
          left={
            <HeaderIconButton
              testID="plan-overview-back-button-loading"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={onBack}
            />
          }
        />
      </View>

      <View style={[styles.body, { paddingTop: navTop + controlHeight.headerButton + space[24] }]}>
        <ContentPending testID="plan-overview-content-pending" compact />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: "absolute",
    left: PAGE_INSET,
    right: PAGE_INSET,
    zIndex: 1,
  },
  body: {
    paddingHorizontal: PAGE_INSET,
  },
});
