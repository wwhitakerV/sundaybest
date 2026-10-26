import { StyleSheet, View, useWindowDimensions } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { formationPaperTheme, space, ThemeScope } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { useHideTabBar } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { useTabBarPaper } from "@/ui/organisms/tab-bar/tab-bar-paper";
import { FormationIdealBoard } from "./FormationIdealBoard";
import { IdealHeader } from "./IdealHeader";

export type FormationIdealViewProps = {
  title: string | null;
  onBack: () => void;
};

/**
 * vIdeal, whole: a page pushed in Home's stack, framed as every such page is
 * — the app's header with Back at its left (`ScreenHeader` over
 * `ScrollScreen`), the tab bar stepping away — all on its own paper: its
 * title in the reference's style over the board, which runs edge to edge.
 */
export function FormationIdealView({ title, onBack }: FormationIdealViewProps) {
  const { width } = useWindowDimensions();
  useHideTabBar(true);
  // Should the bar come back while it's shown, it comes back on the paper.
  useTabBarPaper(formationPaperTheme);

  return (
    <ThemeScope theme={formationPaperTheme}>
      <ScrollScreen
        testID="formation-screen"
        header={
          <ScreenHeader
            testID="formation-header-bar"
            title=""
            left={
              <HeaderIconButton
                testID="formation-back-button"
                icon={ArrowLeft}
                accessibilityLabel="Back"
                onPress={onBack}
              />
            }
          />
        }
      >
        <IdealHeader
          testID="formation-header"
          width={width - PAGE_INSET * 2}
          screenWidth={width}
          title={title}
        />
        <View style={styles.bleed}>
          <FormationIdealBoard
            testID="formation-board"
            width={width}
            accent={formationPaperTheme.colors.accent}
          />
        </View>
      </ScrollScreen>
    </ThemeScope>
  );
}

const styles = StyleSheet.create({
  // The board runs the screen's full width, out past the page's inset.
  bleed: { marginHorizontal: -PAGE_INSET, marginTop: space[8] },
});
