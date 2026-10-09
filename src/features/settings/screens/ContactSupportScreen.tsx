import { StyleSheet, View } from "react-native";
import { Mail, User } from "lucide-react-native";

import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { AboutLead } from "../components/AboutLead";
import { SettingsField } from "../components/SettingsField";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { useContactSupport } from "../hooks/use-contact-support";

/**
 * Contact support, set as every About page is: its title and a line to read,
 * what the message is about as Plans' filter row, its fields as New plan's, one
 * button to send, and what's sent along as its footnote.
 */
export function ContactSupportScreen() {
  const form = useContactSupport();

  return (
    <SettingsSubpage
      testID="contact-support"
      title="Contact support"
      gap={space[28]}
      footnote={`SundayBest ${form.version} is included so we can help faster. Never send passwords or payment details.`}
    >
      <AboutLead title="How can we help?" intro="Ask a question, report a bug, or share an idea." />

      <FilterPills
        testID="contact-support-topics"
        options={form.topics}
        selected={form.topicLabel}
        onSelect={form.pickTopic}
        bleed={PAGE_INSET}
      />

      <View style={styles.fields}>
        <SettingsField
          testID="contact-support-name"
          label="Name"
          placeholder="Name (optional)"
          icon={User}
          autoCapitalize="words"
          {...form.name}
        />
        <SettingsField
          testID="contact-support-email"
          label="Email"
          placeholder="Email"
          icon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          {...form.email}
        />
        <SettingsField
          testID="contact-support-message"
          label="Message"
          placeholder={form.prompt}
          multiline
          maxLength={1200}
          {...form.message}
        />
      </View>

      <Button
        testID="contact-support-send"
        label="Send message"
        onPress={form.send}
        disabled={!form.canSend}
      />
    </SettingsSubpage>
  );
}

const styles = StyleSheet.create({
  fields: { gap: space[12] },
});
