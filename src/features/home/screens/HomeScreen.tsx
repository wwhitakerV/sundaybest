import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { PAGE_INSET, Screen } from "@/ui/Screen";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useTheme } from "@/theme";
import { planOverviewHref } from "@/features/plans";
import {
  getActivePlan,
  getPlanProgress,
  getSamplePlan,
  getSermonForPlan,
  getUserPlans,
  useAppSelector,
} from "@/core/store";
import { ActivePlanCard } from "../components/ActivePlanCard";
import { PlanList } from "../components/PlanList";
import { PlanRow } from "../components/PlanRow";
import { StartHereCard } from "../components/StartHereCard";
import { describePlan } from "../logic/describe-plan";
import { homePlanOverviewHref } from "../logic/routes";

/** Room under the content for the floating tab bar. */
const BOTTOM_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

/**
 * Home, from the store. With a plan under way: that plan up top — which day
 * it's on, how far through, and Continue; the whole card zooms open into
 * Plan Detail — then all the user's plans. With
 * none: a card to add a sermon, and the sample to try (or their other plans,
 * if they have some waiting). The tab bar's + also starts a new plan.
 */
export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const active = useAppSelector(getActivePlan);
  const progress = useAppSelector((state) => (active ? getPlanProgress(state, active.id) : null));
  const sermon = useAppSelector((state) => (active ? getSermonForPlan(state, active.id) : null));
  const hasPlans = useAppSelector((state) => getUserPlans(state).length > 0);
  const sample = useAppSelector(getSamplePlan);
  const sampleDetail = useAppSelector((state) =>
    sample ? describePlan(sample, getPlanProgress(state, sample.id)) : "",
  );

  const openPlan = (planId: string) => router.push(planOverviewHref(planId));
  const addSermon = () => router.push("/(plan-creation)/paste-sermon");

  return (
    // Built like an iOS scroll screen: the scroll view runs edge to edge, and
    // the header and content apply the page inset themselves.
    <Screen testID="home-tab-screen" padded="vertical">
      <View style={styles.header}>
        <Text style={[theme.typography.masthead, { color: theme.colors.text }]}>SUNDAYBEST</Text>
        <HeaderIconButton
          testID="home-tab-account-button"
          icon={UserRound}
          accessibilityLabel="Account"
          bordered={false}
          onPress={() => router.push("/(tabs)/settings")}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {active && progress ? (
          <ActivePlanCard
            title={active.title}
            thumbnailUrl={sermon?.thumbnailUrl ?? null}
            currentDay={progress.currentDayNumber}
            totalDays={progress.totalDays}
            completedDayCount={progress.completedDayCount}
            href={homePlanOverviewHref(active.id)}
          />
        ) : (
          <StartHereCard onAddSermon={addSermon} />
        )}

        {hasPlans ? (
          <>
            <PlanList onOpenPlan={openPlan} />
            <PlanList onOpenPlan={openPlan} />
            <PlanList onOpenPlan={openPlan} />
          </>
        ) : (
          sample && (
            <View style={styles.sample}>
              <Text
                style={[theme.typography.body, styles.label, { color: theme.colors.textMuted }]}
              >
                Try a sample
              </Text>
              <PlanRow
                testID="home-tab-sample-plan"
                title={sample.title}
                detail={sampleDetail}
                done={false}
                onPress={() => openPlan(sample.id)}
              />
            </View>
          )
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PAGE_INSET,
  },
  scroll: { flex: 1 },
  content: {
    gap: 28,
    paddingHorizontal: PAGE_INSET,
    paddingTop: 8,
    paddingBottom: BOTTOM_CLEARANCE,
  },
  sample: { gap: 12 },
  label: { marginLeft: 6 },
});
