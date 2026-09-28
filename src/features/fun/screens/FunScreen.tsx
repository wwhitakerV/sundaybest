import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { PAGE_INSET, Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { SectionHeader } from "@/ui/SectionHeader";
import { TitleHeader } from "@/ui/TitleHeader";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useTheme } from "@/theme";
import { studyHref } from "@/features/plans";
import { getStreak, useAppSelector, useToday } from "@/core/store";
import { CategoryRail } from "../components/CategoryRail";
import { ChallengeFriendsCard } from "../components/ChallengeFriendsCard";
import { PlanPickRail } from "../components/PlanPickRail";
import { PlayNowGrid } from "../components/PlayNowGrid";
import { QuickPlayHero } from "../components/QuickPlayHero";
import { usePlanPicks } from "../hooks/use-plan-picks";

/** Room under the content for the floating tab bar. */
const BOTTOM_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

/** The games have no screens yet; until they do, their doors don't open. */
const openGame = () => undefined;

/**
 * Fun: play, compete, and master Scripture. Today's quick-play game featured
 * up top, the categories in a sideways row, the games two to a row, days from
 * the user's own plans to go back to, and an invitation to challenge
 * friends — all in one vertical scroll, under the tab root's header.
 */
export function FunScreen() {
  const theme = useTheme();
  const router = useRouter();
  const today = useToday();
  const streakDays = useAppSelector((state) => getStreak(state, today).current);
  const picks = usePlanPicks();

  return (
    <Screen testID="fun-screen" padded="vertical">
      <View style={[styles.inset, { gap: theme.spacing.xs }]}>
        <TitleHeader
          title="Fun"
          actions={
            <HeaderIconButton
              testID="fun-account-button"
              icon={UserRound}
              accessibilityLabel="Account"
              bordered={false}
              onPress={() => router.push("/(tabs)/settings")}
            />
          }
        />
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          Play, compete, and master Scripture.
        </Text>
      </View>

      <ScrollView
        testID="fun-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { gap: theme.spacing.xl, paddingTop: theme.spacing.sm },
        ]}
      >
        <View style={styles.inset}>
          <QuickPlayHero testID="fun-quick-play" onPlay={openGame} />
        </View>

        <CategoryRail testID="fun-categories" />

        <View style={[styles.inset, { gap: theme.spacing.md }]}>
          <SectionHeader
            title="Play now"
            action={{ label: "See all", onPress: openGame, testID: "fun-play-now-see-all" }}
          />
          <PlayNowGrid testID="fun-games" streakDays={streakDays} onOpenGame={openGame} />
        </View>

        {picks.length > 0 && (
          <View style={{ gap: theme.spacing.md }}>
            <View style={styles.inset}>
              <SectionHeader
                title="From your plans"
                action={{
                  label: "See all",
                  onPress: () => router.push("/(tabs)/plans"),
                  testID: "fun-plans-see-all",
                }}
              />
            </View>
            <PlanPickRail
              testID="fun-plan-picks"
              picks={picks}
              onOpenPick={(pick) => router.push(studyHref(pick.planId, pick.dayNumber))}
            />
          </View>
        )}

        <View style={[styles.inset, { gap: theme.spacing.md }]}>
          <SectionHeader title="Challenge friends" />
          <ChallengeFriendsCard testID="fun-challenge-friends" onPress={openGame} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  content: { paddingBottom: BOTTOM_CLEARANCE },
});
