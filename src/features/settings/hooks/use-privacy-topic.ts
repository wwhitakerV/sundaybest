import { useLocalSearchParams, useRouter } from "expo-router";

import { parsePrivacyTopicParams } from "../logic/privacy-routes";
import type { AboutSettingPage } from "../logic/about-section";
import { PRIVACY_TOPICS } from "../logic/privacy-topics";
import { useOpenHere } from "./use-open-here";

/**
 * A privacy page's view model: the page its route asks for, if there is one,
 * the way back, and the way to a setting it offers.
 */
export function usePrivacyTopic() {
  const router = useRouter();
  const openHere = useOpenHere();
  const id = parsePrivacyTopicParams(useLocalSearchParams());
  const topic = PRIVACY_TOPICS.find((candidate) => candidate.id === id) ?? null;

  return {
    topic,
    back: () => router.back(),
    open: (page: AboutSettingPage) => openHere.page(page),
  } as const;
}
