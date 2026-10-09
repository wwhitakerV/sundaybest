import { View } from "react-native";
import { Briefcase, CalendarClock, MapPin, type LucideIcon } from "lucide-react-native";

import { space } from "@/theme";
import { SerifBody } from "@/ui/typography/SerifBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { AboutRows } from "../components/AboutRows";
import { CreatorLetterSection } from "../components/CreatorLetterSection";
import { CreatorPortrait } from "../components/CreatorPortrait";
import { CreatorSignOff } from "../components/CreatorSignOff";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { MEET_THE_CREATOR } from "../logic/meet-the-creator";

/** Between the letter's parts: more than a page's usual gap, so each part reads as its own. */
const LETTER_GAP = 48;
/** Above the motto: the usual footnote room and a little more, so it closes the page on its own. */
const MOTTO_SPACE = space[40] + space[20];

const FACT_ICONS: Record<(typeof MEET_THE_CREATOR.facts)[number]["icon"], LucideIcon> = {
  place: MapPin,
  experience: CalendarClock,
  clients: Briefcase,
};

/**
 * Meet the creator: who Walter is — his photo on a card, as a plan's card
 * introduces a sermon, and his facts at a glance beneath — then a note from
 * him, set as About this plan is: its first line as a standfirst, the rest in
 * the Study's reading type, part by part. Signed in his name, his motto its
 * footnote.
 */
export function MeetTheCreatorScreen() {
  const page = MEET_THE_CREATOR;

  return (
    <SettingsSubpage
      testID="meet-the-creator"
      title="Meet the creator"
      gap={LETTER_GAP}
      footnote={page.signOff.motto}
      footnoteSpace={MOTTO_SPACE}
    >
      <View style={{ gap: space[12] }}>
        <CreatorPortrait testID="meet-the-creator-portrait" {...page.identity} />
        <AboutRows
          testID="meet-the-creator-facts"
          rows={page.facts.map((fact) => ({
            key: fact.icon,
            text: fact.text,
            icon: FACT_ICONS[fact.icon],
          }))}
        />
      </View>

      <View style={{ gap: space[8] }}>
        <SFProTitle variant="step" accessibilityRole="header">
          {page.letter}
        </SFProTitle>
        <SerifBody variant="standfirst" tone="text">
          {page.standfirst}
        </SerifBody>
      </View>

      {page.sections.map((section) => (
        <CreatorLetterSection
          key={section.heading ?? "opening"}
          {...(section.heading && { heading: section.heading })}
          blocks={section.blocks}
        />
      ))}

      <CreatorSignOff
        testID="meet-the-creator-sign-off"
        name={page.signOff.name}
        role={page.signOff.role}
      />
    </SettingsSubpage>
  );
}
