import { StyleSheet, View } from "react-native";
import { Church, Link2, ListChecks, Mail, MailCheck } from "lucide-react-native";

import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { AboutLead } from "../components/AboutLead";
import { AboutRows } from "../components/AboutRows";
import { AboutSection } from "../components/AboutSection";
import { SettingsField } from "../components/SettingsField";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { useSermonRemoval } from "../hooks/use-sermon-removal";

const NEEDS = [
  {
    key: "link",
    icon: Link2,
    title: "The sermon's link",
    text: "The original sermon, or the SundayBest plan built from it.",
  },
  {
    key: "email",
    icon: MailCheck,
    title: "A church email",
    text: "One someone at the church can check, in case we need to confirm the request.",
  },
  {
    key: "one",
    icon: ListChecks,
    title: "One sermon per request",
    text: "So the sermon, the church, and our reply stay clear.",
  },
] as const;

/**
 * Request sermon removal, set as every About page is: its title and a line
 * to read, what it needs on one card, then the request — its fields as New
 * plan's, one button to submit, and what to leave out as its footnote.
 */
export function SermonRemovalScreen() {
  const form = useSermonRemoval();

  return (
    <SettingsSubpage
      testID="sermon-removal"
      title="Request sermon removal"
      gap={space[32]}
      footnote="Please don't include members' private information."
    >
      <AboutLead
        title="Remove a sermon from SundayBest."
        intro="If your church would rather a sermon not be used in SundayBest, tell us which one and how to reach you."
      />

      <AboutSection heading="What we need">
        <AboutRows testID="sermon-removal-needs" rows={NEEDS} />
      </AboutSection>

      <AboutSection heading="Your request">
        <View style={styles.fields}>
          <SettingsField
            testID="sermon-removal-church"
            label="Church name"
            placeholder="Church name"
            icon={Church}
            autoCapitalize="words"
            {...form.church}
          />
          <SettingsField
            testID="sermon-removal-link"
            label="Sermon or plan link"
            placeholder="Sermon or plan link"
            icon={Link2}
            keyboardType="url"
            autoCapitalize="none"
            {...form.link}
          />
          <SettingsField
            testID="sermon-removal-email"
            label="Church email"
            placeholder="Church email"
            icon={Mail}
            keyboardType="email-address"
            autoCapitalize="none"
            {...form.email}
          />
          <SettingsField
            testID="sermon-removal-reason"
            label="Reason"
            placeholder="Reason (optional)"
            multiline
            maxLength={600}
            {...form.reason}
          />
        </View>
      </AboutSection>

      <Button
        testID="sermon-removal-submit"
        label="Submit request"
        onPress={form.submit}
        disabled={!form.canSubmit}
      />
    </SettingsSubpage>
  );
}

const styles = StyleSheet.create({
  fields: { gap: space[12] },
});
