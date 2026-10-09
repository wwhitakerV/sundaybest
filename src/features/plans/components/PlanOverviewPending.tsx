import { StyleSheet, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { controlHeight, radius, space } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { DAY_TILE_HEIGHT } from "@/ui/molecules/DayTile";

/** The hero's words and button, about as tall as they draw. */
const HERO_HEIGHT = 260;
/** A day tile's width in the rail. */
const TILE_WIDTH = 60;
const TILES = 5;
/** A study step's row. */
const STEP_HEIGHT = 64;
const STEPS = 4;

export type PlanOverviewPendingProps = {
  /** Where the floating nav sits below the safe area. */
  navTop: number;
  onBack: () => void;
};

/** Plan Overview while its plan loads: the way back, over the page in its own shape. */
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
        <Skeleton testID="plan-overview-content-pending" style={styles.skeleton}>
          <Bone height={HERO_HEIGHT} radius={radius[28]} />
          <View style={styles.rail}>
            {Array.from({ length: TILES }, (_, index) => (
              <Bone key={index} width={TILE_WIDTH} height={DAY_TILE_HEIGHT} radius={radius[20]} />
            ))}
          </View>
          {Array.from({ length: STEPS }, (_, index) => (
            <Bone key={index} height={STEP_HEIGHT} radius={radius[20]} />
          ))}
        </Skeleton>
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
  skeleton: { gap: space[16] },
  rail: { flexDirection: "row", gap: space[10], marginBottom: space[8] },
});
