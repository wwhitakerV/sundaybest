import { View } from "react-native";
import type { ReactNode } from "react";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type AboutSectionProps = {
  /** Its heading, as the Study heads a paragraph. The opening of a letter has none. */
  heading?: string;
  paragraphs?: readonly string[];
  /** What follows its words: a list on a card. */
  children?: ReactNode;
};

/**
 * One part of an About page, set as the Study sets a reading: a small
 * heading, its paragraphs in the reading type and its grey, then anything
 * listed under them.
 */
export function AboutSection({ heading, paragraphs, children }: AboutSectionProps) {
  return (
    <View style={{ gap: space[12] }}>
      {heading && (
        <SFProTitle variant="step" accessibilityRole="header">
          {heading}
        </SFProTitle>
      )}
      {paragraphs?.map((paragraph) => (
        <SFProBody key={paragraph} variant="reading" tone="textInactive">
          {paragraph}
        </SFProBody>
      ))}
      {children}
    </View>
  );
}
