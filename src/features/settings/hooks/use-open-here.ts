import { useRouter } from "expo-router";

import { tabPageHref, tabPrivacyTopicHref, toAppTab, type TabPage } from "@/entities/tabs";
import { useFocusedTab } from "@/hooks/use-focused-tab";
import type { PrivacyTopicId } from "../logic/privacy-routes";

/**
 * Opens Settings' shared pages in whichever tab the reader is in — Settings
 * itself, or a plan's tab when they came from its More menu — so Back steps
 * back the way they came, as iOS does.
 */
export function useOpenHere() {
  const router = useRouter();
  const focusedTab = useFocusedTab();
  const here = () => toAppTab(focusedTab(), "settings");

  return {
    page: (page: TabPage) => router.push(tabPageHref(here(), page)),
    privacyTopic: (topic: PrivacyTopicId) => router.push(tabPrivacyTopicHref(here(), topic)),
  } as const;
}
