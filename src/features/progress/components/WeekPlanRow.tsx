import { useRef, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ellipsis, Flame, LibraryBig } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import type { PopoverAnchor } from "@/ui/organisms/Popover";
import { PopoverMenu } from "@/ui/organisms/PopoverMenu";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { WeekCardPlan } from "../logic/week-history";
import { PlanArtFill } from "./PlanArtFill";
import { WeekArtStack } from "./WeekArtStack";

/** Between the row and its menu hanging under it. */
const MENU_GAP = space[6];
const MORE = 20;
/** A plan's title reads whole in two lines before it trails off. */
const TITLE_LINES = 2;

export type WeekPlanRowProps = {
  plan: WeekCardPlan;
  weekStart: string;
  onSeeWeek: (weekStart: string, planId: string) => void;
  onOpenPlan: (planId: string) => void;
};

/**
 * One plan in a week's card: its artwork, its title (up to two lines), and
 * its church. Tapped, the app's menu — this plan's artwork beside it, so it's
 * plain which plan it's for, and the tab bar's own icons — offers that week on
 * Progress, opened on this plan, or this plan itself — the page dimmed a
 * little behind it, as Progress's week popover dims it.
 */
export function WeekPlanRow({ plan, weekStart, onSeeWeek, onOpenPlan }: WeekPlanRowProps) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const row = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<PopoverAnchor>({ top: 0, right: PAGE_INSET });

  function show() {
    // Hung under the row, its right edge in line with the row's.
    row.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + MENU_GAP, right: window.width - (x + width) });
    });
    setOpen(true);
  }

  return (
    <>
      <Pressable
        ref={row}
        testID={`weeks-plan-${weekStart}-${plan.planId}`}
        accessibilityRole="button"
        accessibilityLabel={[plan.title, plan.church].filter(Boolean).join(", ")}
        onPress={show}
        style={({ pressed }) => [
          styles.row,
          { gap: space[14], paddingHorizontal: space[16], paddingVertical: space[14] },
          pressed && { backgroundColor: theme.colors.segmentBackground },
        ]}
      >
        <WeekArtStack art={[plan.art]} />
        <View style={[styles.copy, { gap: space[2] }]}>
          <SFProBody numberOfLines={TITLE_LINES}>{plan.title}</SFProBody>
          {plan.church && (
            <SFProBody variant="rowDetail" tone="textSupporting" numberOfLines={1}>
              {plan.church}
            </SFProBody>
          )}
        </View>
        <Ellipsis
          size={MORE}
          color={theme.colors.textMuted}
          strokeWidth={theme.icon.strokeWidth}
          style={styles.more}
        />
      </Pressable>
      <PopoverMenu
        testID={`weeks-plan-${weekStart}-${plan.planId}-menu`}
        accessibilityLabel={plan.title}
        visible={open}
        onClose={() => setOpen(false)}
        anchor={anchor}
        aside={<PlanArtFill art={plan.art} />}
        dim
        items={[
          {
            label: "See this week",
            icon: Flame,
            testID: `weeks-plan-${weekStart}-${plan.planId}-see`,
            onPress: () => onSeeWeek(weekStart, plan.planId),
          },
          {
            label: "Open plan",
            icon: LibraryBig,
            testID: `weeks-plan-${weekStart}-${plan.planId}-open`,
            onPress: () => onOpenPlan(plan.planId),
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // The artwork's top in line with the title's, however many lines the title takes.
  row: { flexDirection: "row", alignItems: "flex-start" },
  copy: { flex: 1 },
  more: { alignSelf: "center" },
});
