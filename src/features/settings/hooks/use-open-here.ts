import { useRouter } from "expo-router";

import {
  PLACE_ROUTES,
  placePageHref,
  placePrivacyTopicHref,
  toPlace,
  type TabPage,
} from "@/entities/tabs";
import { useFocusedPlace } from "@/hooks/use-focused-place";
import type { PrivacyTopicId } from "../logic/privacy-routes";

/**
 * Opens Settings' shared pages where the reader is — Settings itself, or,
 * from a plan's More menu, the plan's tab, Plans' search or over Weeks — so
 * Back steps back the way they came, as iOS does.
 */
export function useOpenHere() {
  const router = useRouter();
  const focusedPlace = useFocusedPlace(PLACE_ROUTES);
  const here = () => toPlace(focusedPlace(), "settings");

  return {
    page: (page: TabPage) => router.push(placePageHref(here(), page)),
    privacyTopic: (topic: PrivacyTopicId) => router.push(placePrivacyTopicHref(here(), topic)),
  } as const;
}
