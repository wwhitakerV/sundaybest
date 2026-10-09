import { View } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type AboutLeadProps = {
  /** The page's point, as its title. */
  title: string;
  /** A line or two under it. */
  intro: string;
  /** A small note under that: when a policy took effect. */
  note?: string;
};

/**
 * How an About page opens, as the Study opens a step: the app's page title,
 * then a line or two in the Study's reading type and its grey.
 */
export function AboutLead({ title, intro, note }: AboutLeadProps) {
  return (
    <View style={{ gap: space[12] }}>
      <SFProTitle variant="screen" accessibilityRole="header">
        {title}
      </SFProTitle>
      <SFProBody variant="reading" tone="textInactive">
        {intro}
      </SFProBody>
      {note && (
        <SFProBody variant="detail" tone="textMuted">
          {note}
        </SFProBody>
      )}
    </View>
  );
}
