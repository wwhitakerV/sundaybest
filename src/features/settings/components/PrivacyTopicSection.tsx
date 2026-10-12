import { Bell, BookOpen, Type, type LucideIcon } from "lucide-react-native";

import type { AboutSectionContent, AboutSettingPage } from "../logic/about-section";
import { AboutRows } from "./AboutRows";
import { AboutSection } from "./AboutSection";

/** A setting's icon, as Settings itself shows it. */
const SETTING_ICONS: Record<AboutSettingPage, LucideIcon> = {
  "daily-reminder": Bell,
  "bible-translation": BookOpen,
  "text-size": Type,
};

export type PrivacyTopicSectionProps = {
  section: AboutSectionContent;
  /** Its place on the page, for its items' card's testID. */
  index: number;
  /** In a document whose sections are numbered, its number, before its heading. */
  number?: number;
  onOpen: (page: AboutSettingPage) => void;
};

/**
 * One part of a privacy page: its heading and paragraphs, its items on a
 * card — each named, then said — and a row to any setting it talks about,
 * named and marked as Settings shows it.
 */
export function PrivacyTopicSection({ section, index, number, onOpen }: PrivacyTopicSectionProps) {
  const heading = number === undefined ? section.heading : `${number}. ${section.heading}`;

  return (
    <AboutSection heading={heading} {...(section.paragraphs && { paragraphs: section.paragraphs })}>
      {section.items && (
        <AboutRows
          testID={`privacy-topic-section-${index}-items`}
          rows={section.items.map((item) => ({
            key: item.text,
            text: item.text,
            ...(item.label && { title: item.label }),
          }))}
        />
      )}
      {section.actions && (
        <AboutRows
          testID={`privacy-topic-section-${index}-actions`}
          rows={section.actions.map((action) => ({
            key: action.page,
            title: action.label,
            icon: SETTING_ICONS[action.page],
            onPress: () => onOpen(action.page),
          }))}
        />
      )}
    </AboutSection>
  );
}
