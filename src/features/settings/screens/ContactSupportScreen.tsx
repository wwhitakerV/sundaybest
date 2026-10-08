import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { Bug, Lightbulb, Mail, MessageCircleQuestion } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { Card } from "@/ui/atoms/Card";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsFormField } from "../components/SettingsFormField";
import { SettingsHeroCard } from "../components/SettingsHeroCard";
import { SettingsSubpage } from "../components/SettingsSubpage";

const TOPICS = [
  { value: "question", label: "Question", icon: MessageCircleQuestion },
  { value: "bug", label: "Bug", icon: Bug },
  { value: "idea", label: "Idea", icon: Lightbulb },
] as const;

type SupportTopic = (typeof TOPICS)[number]["value"];

export function ContactSupportScreen() {
  const theme = useTheme();
  const [topic, setTopic] = useState<SupportTopic>("question");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const version = Constants.expoConfig?.version ?? "—";
  const canSubmit = email.trim().length > 0 && message.trim().length > 0;

  function submit() {
    Alert.alert(
      "Support transport not configured",
      "This screen is ready for the app's support endpoint or support-email transport. The uploaded source did not include either, so this build does not pretend the request was sent.",
    );
  }

  return (
    <SettingsSubpage testID="contact-support" title="Contact support">
      <SettingsHeroCard
        testID="contact-support-hero"
        icon={Mail}
        eyebrow="SundayBest support"
        title="Tell us what happened."
        detail="Choose the kind of help you need, then send enough context for someone to understand the problem without a long back-and-forth."
        accent
      />

      <View style={{ gap: space[10] }}>
        <MonoBody variant="supporting" tone="textMuted">
          WHAT DO YOU NEED?
        </MonoBody>
        <View testID="contact-support-topics" style={[styles.topics, { gap: space[8] }]}>
          {TOPICS.map((item) => {
            const selected = item.value === topic;
            const Icon = item.icon;
            return (
              <Pressable
                key={item.value}
                testID={`contact-support-topic-${item.value}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={item.label}
                onPress={() => setTopic(item.value)}
                style={({ pressed }) => [
                  styles.topic,
                  {
                    backgroundColor: selected ? theme.colors.background : theme.colors.surface,
                    borderColor: selected ? theme.colors.text : theme.colors.containerBorder,
                    borderRadius: radius[16],
                    gap: space[8],
                    opacity: pressed ? 0.72 : 1,
                  },
                  selected && styles.topicSelected,
                ]}
              >
                <Icon size={18} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
                <SFProBody variant="label">{item.label}</SFProBody>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Card radius={28} style={[styles.form, { gap: space[18], padding: space[18] }]}>
        <SettingsFormField
          testID="contact-support-name"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />
        <SettingsFormField
          testID="contact-support-email"
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <SettingsFormField
          testID="contact-support-message"
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="What happened?"
          multiline
          maxLength={1200}
        />
        <Button
          testID="contact-support-send"
          label="Send message"
          onPress={submit}
          disabled={!canSubmit}
        />
      </Card>

      <Card radius={24} style={[styles.context, { gap: space[8], padding: space[18] }]}>
        <MonoBody variant="supporting" tone="textMuted">
          INCLUDED CONTEXT
        </MonoBody>
        <SFProBody variant="detail" tone="textMuted">
          SundayBest {version} ·{" "}
          {topic === "bug" ? "Bug report" : topic === "idea" ? "Feature idea" : "Support question"}
        </SFProBody>
        <SFProBody variant="detail" tone="textSupporting">
          Never put passwords, payment details, or other secrets in a support message.
        </SFProBody>
      </Card>
    </SettingsSubpage>
  );
}

const styles = StyleSheet.create({
  topics: { flexDirection: "row" },
  topic: {
    flex: 1,
    minHeight: 74,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topicSelected: { borderWidth: 2 },
  form: { borderWidth: 1 },
  context: { borderWidth: 1 },
});
