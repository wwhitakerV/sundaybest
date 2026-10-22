import { StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";

import { HERO_BOTTOM_SPACE, HeroContent, getHeroPalette, type HeroPlan } from "@/entities/plan";
import { radius, useTheme } from "@/theme";
import { PAGE_INSET } from "@/ui/organisms/Screen";

/** The hero's corners, the room above its words, and below them — as Plan Detail's. */
const HERO_RADIUS = radius[36];
const HERO_BREATHE_TOP = 52;
const HERO_BREATHE_BOTTOM = HERO_BOTTOM_SPACE;

/** What it says: what the app does, and how to begin — never when the sermon was heard. */
const WORDS: HeroPlan = {
  title: "Turn a sermon into daily study",
  church: null,
  words: {
    status: "START HERE",
    action: "Add a sermon",
    today: "Search for it, or paste its link.",
  },
  totalDays: 0,
  completedDayCount: 0,
};

export type StartHereHeroProps = {
  onAddSermon: () => void;
};

/**
 * Home before there's a plan: the plan hero's own frame in the plan's place —
 * full width, rounded at the top, the same room to breathe — on the brand's
 * red, the launch film's own, in white. Its words are a plan hero's: where
 * you are, what the app does, Add a sermon, and how. So Home has one shape,
 * plan or none.
 */
export function StartHereHero({ onAddSermon }: StartHereHeroProps) {
  const theme = useTheme();
  // The red, flat: no gradient, no wash — there's no sermon's colour or still to show yet.
  const { colour, light } = getHeroPalette([], theme.colors.accent);

  return (
    <View style={styles.slot}>
      <View testID="home-tab-start-here" style={[styles.hero, { backgroundColor: colour }]}>
        <HeroContent
          plan={WORDS}
          light={light}
          onContinue={onAddSermon}
          actionIcon={Plus}
          testIDs={{
            content: "home-tab-start-here-content",
            continueButton: "home-tab-add-sermon-button",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full width, past the page inset, as the plan hero is.
  slot: { marginHorizontal: -PAGE_INSET },
  hero: {
    paddingHorizontal: PAGE_INSET,
    paddingTop: HERO_BREATHE_TOP,
    paddingBottom: HERO_BREATHE_BOTTOM,
    borderTopLeftRadius: HERO_RADIUS,
    borderTopRightRadius: HERO_RADIUS,
    overflow: "hidden",
  },
});
