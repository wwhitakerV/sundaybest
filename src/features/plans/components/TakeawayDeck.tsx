import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { takeawayCardWidth, takeawayNumber } from "../logic/plan-about";

/** How much narrower than the page a card is, so the next one shows at the edge, waiting. */
const PEEK = space[36];
const CARD_GAP = space[12];

export type TakeawayDeckProps = {
  takeaways: readonly string[];
  testID?: string | undefined;
};

/**
 * About this plan's key takeaways, dealt as cards — one to a card, read one
 * at a time and swiped sideways to the next, which peeks in at the edge. Each
 * card is sized from the screen's width, so a small phone gets a narrower
 * card, never a cramped one; the cards share the tallest one's height.
 */
export function TakeawayDeck({ takeaways, testID }: TakeawayDeckProps) {
  const { width } = useWindowDimensions();
  const cardWidth = takeawayCardWidth({
    viewportWidth: width,
    inset: PAGE_INSET,
    peek: PEEK,
    count: takeaways.length,
  });
  const total = takeawayNumber(takeaways.length - 1);

  return (
    <ScrollView
      testID={testID && `${testID}-takeaways-deck`}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + CARD_GAP}
      decelerationRate="fast"
      scrollEnabled={takeaways.length > 1}
      style={styles.deck}
      contentContainerStyle={styles.cards}
    >
      {takeaways.map((takeaway, index) => (
        <Card
          key={takeaway}
          testID={testID && `${testID}-takeaway-card`}
          style={[styles.card, { width: cardWidth }]}
        >
          <View style={styles.position}>
            <SerifTitle
              variant="title"
              tone="accent"
              testID={testID && `${testID}-takeaway-number`}
            >
              {takeawayNumber(index)}
            </SerifTitle>
            <MonoLabel tone="textMuted" testID={testID && `${testID}-takeaway-total`}>
              {`/ ${total}`}
            </MonoLabel>
          </View>
          <SFProBody variant="reading" tone="text" testID={testID && `${testID}-takeaway`}>
            {takeaway}
          </SFProBody>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Out to the screen's edges, the cards inset within.
  deck: { marginHorizontal: -PAGE_INSET, flexGrow: 0 },
  cards: { paddingHorizontal: PAGE_INSET, gap: CARD_GAP },
  card: { padding: space[24], gap: space[16] },
  position: { flexDirection: "row", alignItems: "baseline", gap: space[6] },
});
