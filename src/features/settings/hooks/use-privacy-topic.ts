import { useLocalSearchParams, useRouter } from "expo-router";

import { parsePrivacyTopicParams } from "../logic/privacy-routes";
import type { PrivacySettingHref } from "../logic/privacy-topic";
import { PRIVACY_TOPICS } from "../logic/privacy-topics";

/**
 * A privacy page's view model: the page its route asks for, if there is one,
 * the way back, and the way to a setting it offers.
 */
export function usePrivacyTopic() {
  const router = useRouter();
  const id = parsePrivacyTopicParams(useLocalSearchParams());
  const topic = PRIVACY_TOPICS.find((candidate) => candidate.id === id) ?? null;

  return {
    topic,
    back: () => router.back(),
    open: (href: PrivacySettingHref) => router.push(href),
  } as const;
}
