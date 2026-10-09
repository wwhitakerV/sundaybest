import { useRouter } from "expo-router";
import {
  Archive,
  EyeOff,
  FileText,
  Lock,
  Route,
  SlidersHorizontal,
  Smartphone,
  UserX,
  type LucideIcon,
} from "lucide-react-native";

import { space } from "@/theme";
import { AboutLead } from "../components/AboutLead";
import { AboutRows } from "../components/AboutRows";
import { AboutSection } from "../components/AboutSection";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { privacyTopicHref, type PrivacyTopicId } from "../logic/privacy-routes";
import { PRIVACY_LANDING, PRIVACY_TOPICS } from "../logic/privacy-topics";
import { FULL_PRIVACY_POLICY } from "../logic/privacy-full-policy";

const GLANCE_ICONS: Record<(typeof PRIVACY_LANDING.glance)[number]["icon"], LucideIcon> = {
  account: UserX,
  reflections: Lock,
  tracking: EyeOff,
};

const TOPIC_ICONS: Record<PrivacyTopicId, LucideIcon> = {
  keep: Archive,
  device: Smartphone,
  use: Route,
  controls: SlidersHorizontal,
  policy: FileText,
};

/**
 * Privacy policy: its promise as the page's title, the three answers most
 * people come for on a card, then each page of the details a row away, and
 * when it took effect as its footnote.
 */
export function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SettingsSubpage
      testID="privacy-policy"
      title="Privacy policy"
      gap={space[32]}
      footnote={FULL_PRIVACY_POLICY.effective}
    >
      <AboutLead title={PRIVACY_LANDING.statement} intro={PRIVACY_LANDING.intro} />

      <AboutRows
        testID="privacy-policy-glance"
        rows={PRIVACY_LANDING.glance.map((answer) => ({
          key: answer.icon,
          title: answer.title,
          text: answer.text,
          icon: GLANCE_ICONS[answer.icon],
        }))}
      />

      <AboutSection heading={PRIVACY_LANDING.details}>
        <AboutRows
          testID="privacy-policy-details"
          rows={PRIVACY_TOPICS.map((topic) => ({
            key: topic.id,
            title: topic.row,
            icon: TOPIC_ICONS[topic.id],
            onPress: () => router.push(privacyTopicHref(topic.id)),
          }))}
        />
      </AboutSection>
    </SettingsSubpage>
  );
}
