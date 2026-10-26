import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { space, useTheme } from "@/theme";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import eyeArt from "../../../../assets/formation/icons-600/human-eye.png";
import brainArt from "../../../../assets/formation/icons-600/human-brain.png";
import mouthArt from "../../../../assets/formation/icons-600/human-mouth.png";
import shieldArt from "../../../../assets/formation/icons-600/discipline-shield.png";
import heartArt from "../../../../assets/formation/icons-600/human-heart.png";
import { FormationArtBoard } from "../components/FormationArtBoard";
import { FormationIdealView } from "../components/FormationIdealView";
import { FormationLineBoard } from "../components/FormationLineBoard";
import { FormationTrackView } from "../components/FormationTrackView";
import { PlanLeadFor } from "@/features/plans";
import { useFormationView } from "../hooks/use-formation-view";

const ARTS = [eyeArt, brainArt, mouthArt, shieldArt, heartArt] as const;

/**
 * Formation (a preview, opened from the wordmark's development sheet, in
 * eight versions). vIdeal is its reference redrawn whole, on its own paper,
 * under a header in the reference's style (`FormationIdealView`); vIdeal 2
 * makes that board a track a finger moves (`FormationTrackView`). The rest
 * lead with the plan under way as Plans does (`PlanLeadFor`), then that
 * day's journey as a board: v4…v8 one to each artwork (`FormationArtBoard`),
 * vLine only one fine line and its icons, their shadows cast
 * (`FormationLineBoard`) — all on the app's own white page.
 */
export function FormationScreen() {
  const { colors } = useTheme();
  const view = useFormationView();
  const { layout } = view;
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();

  if (layout.kind === "ideal") return <FormationIdealView title={view.title} onBack={view.back} />;
  if (layout.kind === "track") return <FormationTrackView title={view.title} onBack={view.back} />;

  return (
    <View testID="formation-screen" style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        testID="formation-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: FLOATING_NAV_BAR_CLEARANCE }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + space[16] }]}>
          {view.planId && <PlanLeadFor planId={view.planId} testID="formation-lead" />}
        </View>

        {layout.kind === "line" ? (
          <FormationLineBoard
            testID="formation-board"
            width={W}
            height={W / layout.aspect}
            layout={layout}
            arts={ARTS}
          />
        ) : (
          <FormationArtBoard width={W} layout={layout} arts={ARTS} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { paddingHorizontal: PAGE_INSET, paddingBottom: space[24] },
});
