import { space } from "@/theme";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { PrivacyHero } from "../components/PrivacyHero";
import { PrivacyQuote } from "../components/PrivacyQuote";
import { PrivacySectionBlock } from "../components/PrivacySectionBlock";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { usePrivacyHero } from "../hooks/use-privacy-hero";
import { usePrivacyTopic } from "../hooks/use-privacy-topic";

/**
 * One of Privacy policy's pages, set like a typeset document: its compact
 * hero, one featured statement, then its sections. The complete policy is the
 * same, dated, its sections numbered.
 */
export function PrivacyTopicScreen() {
  const { topic, back, open } = usePrivacyTopic();
  const hero = usePrivacyHero();

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
    <SettingsSubpage
      testID="privacy-topic"
      title={topic.title}
      contentStyle={{ gap: space[36] }}
      hero={{ overHero: hero.overHero, onScroll: hero.onScroll }}
    >
      <PrivacyHero
        testID="privacy-topic-hero"
        eyebrow={topic.eyebrow}
        statement={topic.statement}
        intro={topic.intro}
        onReach={hero.onReach}
        {...(topic.effective && { effective: topic.effective })}
      />

      {topic.quote && <PrivacyQuote testID="privacy-topic-quote" text={topic.quote} />}

      {topic.sections.map((section, index) => (
        <PrivacySectionBlock
          key={section.heading}
          section={section}
          onOpen={open}
          {...(topic.numbered && { number: index + 1 })}
        />
      ))}
    </SettingsSubpage>
  );
}
