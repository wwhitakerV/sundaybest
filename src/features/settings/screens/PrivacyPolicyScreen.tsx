import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { PrivacyHero } from "../components/PrivacyHero";
import { PrivacyPromises } from "../components/PrivacyPromises";
import { PrivacyShortVersion } from "../components/PrivacyShortVersion";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { usePrivacyHero } from "../hooks/use-privacy-hero";
import { privacyTopicHref } from "../logic/privacy-routes";
import { PRIVACY_LANDING, PRIVACY_TOPICS } from "../logic/privacy-topics";
import { FULL_PRIVACY_POLICY } from "../logic/privacy-full-policy";

const CHEVRON = 18;

/**
 * Privacy policy: its promise up top, its three strongest promises, the short
 * version as four rows, and the complete policy one tap away.
 */
export function PrivacyPolicyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const hero = usePrivacyHero();

  return (
    <SettingsSubpage
      testID="privacy-policy"
      title="Privacy policy"
      contentStyle={{ gap: space[32] }}
      hero={{ overHero: hero.overHero, onScroll: hero.onScroll }}
    >
      <PrivacyHero
        testID="privacy-policy-hero"
        eyebrow={PRIVACY_LANDING.eyebrow}
        statement={PRIVACY_LANDING.statement}
        intro={PRIVACY_LANDING.intro}
        onReach={hero.onReach}
      />

      <PrivacyPromises testID="privacy-trust" promises={PRIVACY_LANDING.promises} />

      <PrivacyShortVersion
        testID="privacy-short-version"
        heading={PRIVACY_LANDING.shortVersion}
        rows={PRIVACY_TOPICS.flatMap((topic) =>
          topic.row
            ? [
                {
                  id: topic.id,
                  label: topic.row,
                  onPress: () => router.push(privacyTopicHref(topic.id)),
                },
              ]
            : [],
        )}
      />

      <View style={{ gap: space[8] }}>
        <Pressable
          testID="privacy-policy-complete"
          accessibilityRole="button"
          accessibilityLabel={PRIVACY_LANDING.complete}
          onPress={() => router.push(privacyTopicHref("policy"))}
          style={[styles.complete, { gap: space[6] }]}
        >
          <SFProBody variant="listItem" tone="accent">
            {PRIVACY_LANDING.complete}
          </SFProBody>
          <ChevronRight
            size={CHEVRON}
            color={theme.colors.accent}
            strokeWidth={theme.icon.strokeWidth}
          />
        </Pressable>
        <SFProBody variant="detail" tone="textMuted">
          {FULL_PRIVACY_POLICY.effective}
        </SFProBody>
      </View>
    </SettingsSubpage>
  );
}

const styles = StyleSheet.create({
  complete: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", minHeight: 44 },
});
