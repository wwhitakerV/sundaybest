import { space } from "@/theme";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { AboutCallout } from "../components/AboutCallout";
import { AboutLead } from "../components/AboutLead";
import { PrivacyTopicSection } from "../components/PrivacyTopicSection";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { usePrivacyTopic } from "../hooks/use-privacy-topic";

/**
 * One of Privacy policy's pages, set as every About page is: its title and
 * opening line, its one strong statement on a card, then its sections. The
 * complete policy is the same, dated, its sections numbered.
 */
export function PrivacyTopicScreen() {
  const { topic, back, open } = usePrivacyTopic();

  if (!topic) {
    return (
      <NotFoundScreen
        testID="privacy-topic-not-found"
        title="This page isn’t here"
        message="It may have moved. Privacy policy has everything it covered."
        actionLabel="Back"
        onAction={back}
      />
    );
  }

  return (
    <SettingsSubpage testID="privacy-topic" title={topic.title} gap={space[32]}>
      <AboutLead
        title={topic.statement}
        intro={topic.intro}
        {...(topic.effective && { note: topic.effective })}
      />

      {topic.quote && <AboutCallout testID="privacy-topic-quote" text={topic.quote} />}

      {topic.sections.map((section, index) => (
        <PrivacyTopicSection
          key={section.heading}
          section={section}
          index={index}
          onOpen={open}
          {...(topic.numbered && { number: index + 1 })}
        />
      ))}
    </SettingsSubpage>
  );
}
