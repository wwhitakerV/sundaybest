import { View } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import type { CreatorBlock } from "../logic/meet-the-creator";
import { AboutCallout } from "./AboutCallout";
import { AboutRows } from "./AboutRows";

export type CreatorLetterSectionProps = { heading?: string; blocks: readonly CreatorBlock[] };

/**
 * A part of Walter's letter: its heading close over its words, its
 * paragraphs in the Study's reading type with room between them, its one
 * line in serif on a card, and a list on a card of its own.
 */
export function CreatorLetterSection({ heading, blocks }: CreatorLetterSectionProps) {
  return (
    <View style={{ gap: space[8] }}>
      {heading && (
        <SFProTitle variant="step" accessibilityRole="header">
          {heading}
        </SFProTitle>
      )}
      <View style={{ gap: space[16] }}>
        {blocks.map((block) => {
          switch (block.kind) {
            case "paragraph":
              return (
                <SFProBody key={block.text} variant="reading" tone="textInactive">
                  {block.text}
                </SFProBody>
              );
            case "quote":
              return (
                <AboutCallout key={block.text} testID="meet-the-creator-quote" text={block.text} />
              );
            case "list":
              return (
                <AboutRows
                  key={block.items.join(" ")}
                  testID="meet-the-creator-decisions"
                  rows={block.items.map((item) => ({ key: item, text: item }))}
                />
              );
          }
        })}
      </View>
    </View>
  );
}
