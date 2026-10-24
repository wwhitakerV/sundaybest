import { useRef } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { DayCardLook } from "../logic/day-cards";

/** A day's card: this share of the screen's width, so the next shows waiting at the edge. */
const CARD_SHARE = 0.66;
/** The room between cards. */
const APART = space[12];
/** A card's title: two lines at most, so every card is the same height. */
const TITLE_LINES = 2;

export type DayCarouselProps = {
  days: DayCardLook[];
  /** The day the plan's on: the carousel opens settled on it. */
  currentDayNumber: number | null;
  onOpenDay: (dayNumber: number) => void;
  /** A finger on it, and off: while one is, the plans don't turn. */
  onTouching: (touching: boolean) => void;
  testID?: string;
};

/** One day: its number and where it stands, its study's title, and how long it takes. */
function DayCard({
  day,
  width,
  onOpen,
  testID,
}: {
  day: DayCardLook;
  width: number;
  onOpen: () => void;
  testID: string;
}) {
  const quiet = day.state === "locked";
  return (
    <Card
      testID={testID}
      accessibilityLabel={day.accessibilityLabel}
      onPress={onOpen}
      style={[styles.card, { width }]}
    >
      <View style={styles.labels}>
        <MonoLabel variant="labelTracked" tone={quiet ? "textMuted" : "text"}>
          {day.label}
        </MonoLabel>
        {day.standing && (
          <MonoLabel
            variant="labelTracked"
            tone={day.state === "today" ? "accent" : "textSupporting"}
          >
            {day.standing}
          </MonoLabel>
        )}
      </View>
      <SerifTitle
        variant="heading"
        tone={quiet ? "textMuted" : "text"}
        numberOfLines={TITLE_LINES}
        style={styles.title}
      >
        {day.title}
      </SerifTitle>
      <SFProBody variant="rowDetail" tone="textSupporting">
        {day.length}
      </SFProBody>
    </Card>
  );
}

/**
 * A plan's days, always in view, swiped through as the plans are — its own
 * carousel, flung as far as the finger throws it with iOS's own momentum,
 * settling on a card — opened settled on the day the plan's on. A tap on a
 * day goes straight into its study; one not open yet stays where it is.
 * While a finger's on it, the plans can't turn.
 */
export function DayCarousel({
  days,
  currentDayNumber,
  onOpenDay,
  onTouching,
  testID,
}: DayCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.round(screenWidth * CARD_SHARE);
  const step = cardWidth + APART;
  const list = useRef<ScrollView>(null);
  const settledOnce = useRef(false);
  const startAt = Math.max(
    0,
    days.findIndex((day) => day.dayNumber === currentDayNumber),
  );

  return (
    <ScrollView
      ref={list}
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="normal"
      snapToInterval={step}
      snapToAlignment="start"
      contentContainerStyle={styles.row}
      onTouchStart={() => onTouching(true)}
      onTouchEnd={() => onTouching(false)}
      onTouchCancel={() => onTouching(false)}
      onMomentumScrollEnd={() => onTouching(false)}
      // Laid out, it's put on the plan's day — once, never again under the reader's finger.
      onLayout={() => {
        if (settledOnce.current) return;
        settledOnce.current = true;
        if (startAt > 0) list.current?.scrollTo({ x: startAt * step, animated: false });
      }}
    >
      {days.map((day) => (
        <DayCard
          key={day.dayNumber}
          testID={`${testID ?? "plan-days"}-${day.dayNumber}`}
          day={day}
          width={cardWidth}
          onOpen={() => onOpenDay(day.dayNumber)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: PAGE_INSET, gap: APART },
  card: { gap: space[8] },
  labels: { flexDirection: "row", justifyContent: "space-between", gap: space[8] },
  title: { flexGrow: 1 },
});
