import { Fragment } from "react";
import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { WeekCard } from "../logic/week-history";
import { WeekPlanRow } from "./WeekPlanRow";

export type WeekCardRowProps = {
  card: WeekCard;
  onSeeWeek: (weekStart: string, planId: string) => void;
  onOpenPlan: (planId: string) => void;
};

/**
 * One week, on a soft card, with what helps place it: its dates and days
 * studied, the first thing written in it, then each of its plans as a row of
 * its own — artwork, full title, church — so any one can be opened exactly.
 */
export function WeekCardRow({ card, onSeeWeek, onOpenPlan }: WeekCardRowProps) {
  const theme = useTheme();

  return (
    <View
      testID={`weeks-card-${card.weekStart}`}
      style={[
        styles.card,
        {
          borderRadius: radius[24],
          borderColor: theme.colors.containerBorder,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View
        style={{
          gap: space[6],
          paddingHorizontal: space[16],
          paddingTop: space[14],
          paddingBottom: space[4],
        }}
      >
        <View style={[styles.row, { gap: space[12] }]}>
          <MonoLabel
            variant="labelTracked"
            tone={card.current ? "accent" : "textMuted"}
            style={[styles.caps, styles.grow]}
          >
            {card.dates}
          </MonoLabel>
          {card.days && (
            <SFProBody variant="detail" tone="textMuted">
              {card.days}
            </SFProBody>
          )}
        </View>
        {card.wrote && (
          <SFProBody variant="rowDetail" numberOfLines={1}>
            {`“${card.wrote}”`}
          </SFProBody>
        )}
      </View>
      {card.plans.map((plan, index) => (
        <Fragment key={plan.planId}>
          {index > 0 && <Divider />}
          <WeekPlanRow
            plan={plan}
            weekStart={card.weekStart}
            onSeeWeek={onSeeWeek}
            onOpenPlan={onOpenPlan}
          />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
  caps: { textTransform: "uppercase" },
});
