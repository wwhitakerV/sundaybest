import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { space } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { Divider } from "@/ui/atoms/Divider";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import type { PrivacySection, PrivacySettingHref } from "../logic/privacy-topic";

export type PrivacySectionBlockProps = {
  section: PrivacySection;
  /** Its number, in a document whose sections are numbered: set small, in red, above its heading. */
  number?: number;
  /** Goes to a setting the section offers. */
  onOpen: (href: PrivacySettingHref) => void;
};

/**
 * One part of a privacy page, as a typeset document: its heading, its words in
 * full ink, its items each named then said with a hairline between — never in
 * a card — and a small button where there's a real setting to go to.
 */
export function PrivacySectionBlock({ section, number, onOpen }: PrivacySectionBlockProps) {
  return (
    <View style={{ gap: space[14] }}>
      <View style={{ gap: space[6] }}>
        {number !== undefined && (
          <MonoLabel variant="label" tone="accent">
            {String(number).padStart(2, "0")}
          </MonoLabel>
        )}
        <SFProTitle variant="section" accessibilityRole="header">
          {section.heading}
        </SFProTitle>
      </View>

      {section.paragraphs?.map((paragraph) => (
        <SFProBody key={paragraph} variant="bodyLoose">
          {paragraph}
        </SFProBody>
      ))}

      {section.items && (
        <View testID="privacy-items">
          {section.items.map((item, index) => (
            <Fragment key={item.text}>
              {index > 0 && <Divider />}
              <View style={{ gap: space[2], paddingVertical: space[14] }}>
                {item.label && <SFProBody variant="listItem">{item.label}</SFProBody>}
                <SFProBody variant="bodyLoose">{item.text}</SFProBody>
              </View>
            </Fragment>
          ))}
        </View>
      )}

      {section.actions && (
        <View style={[styles.actions, { gap: space[8] }]}>
          {section.actions.map((action) => (
            <CompactButton
              key={action.href}
              testID={`privacy-action-${action.href.split("/").at(-1) ?? ""}`}
              label={action.label}
              icon={ChevronRight}
              iconPosition="end"
              tone="soft"
              align="start"
              onPress={() => onOpen(action.href)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap" },
});
