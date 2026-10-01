import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/organisms/Screen";
import { SectionHeader } from "@/ui/SectionHeader";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { FLOATING_NAV_BAR } from "@/ui/organisms/floatingNavBar";
import { useTheme } from "@/theme";
import { getStreak, useAppSelector, useToday } from "@/core/store";
import { CategoryRail } from "../components/CategoryRail";
import { ChallengeFriendsCard } from "../components/ChallengeFriendsCard";
import { PlayNowGrid } from "../components/PlayNowGrid";
import { QuickPlayHero } from "../components/QuickPlayHero";
import { useCategoryScroll } from "../hooks/use-category-scroll";
import { funDestinationHref, getGameHref, type FunDestination } from "../logic/destinations";

/** Room under the content for the floating tab bar. */
const BOTTOM_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

/**
 * Fun: play, compete, and master Scripture. Today's quick-play game featured
 * up top, the categories in a sideways row, the games two to a row, and an
 * invitation to challenge friends — all in one vertical scroll, under the tab
 * root's header, set in from the edges a little closer than the other tabs.
 * Every game, its full list, and the invitation open their own page.
 */
export function FunScreen() {
  const theme = useTheme();
  const router = useRouter();
  const today = useToday();
  const streakDays = useAppSelector((state) => getStreak(state, today).current);
  const { category, games, select, scrollRef, onRailLayout } = useCategoryScroll();
  const inset = { paddingHorizontal: theme.spacing.md };
  const open = (destination: FunDestination) => router.push(funDestinationHref(destination));

  return (
    <Screen testID="fun-screen" padded="vertical">
      <View testID="fun-intro" style={[inset, { gap: theme.spacing.xs }]}>
        <TitleHeader title="Fun" />
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          Play, compete, and master Scripture.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        testID="fun-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { gap: theme.spacing.lg, paddingTop: theme.spacing.md },
        ]}
      >
        <View style={inset}>
          <QuickPlayHero testID="fun-quick-play" onPlay={() => open("heads-up")} />
        </View>

        <CategoryRail
          testID="fun-categories"
          selected={category}
          onSelect={select}
          onLayout={onRailLayout}
        />

        <View style={[inset, { gap: theme.spacing.md }]}>
          <SectionHeader
            title="Play now"
            action={{
              label: "See all",
              onPress: () => open("all-games"),
              testID: "fun-play-now-see-all",
            }}
          />
          <PlayNowGrid
            testID="fun-games"
            games={games}
            streakDays={streakDays}
            onOpenGame={(game) => router.push(getGameHref(game))}
          />
        </View>

        <View style={[inset, { gap: theme.spacing.md }]}>
          <SectionHeader title="Challenge friends" />
          <ChallengeFriendsCard
            testID="fun-challenge-friends"
            onPress={() => open("challenge-friends")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: BOTTOM_CLEARANCE },
});
