import { useState } from "react";
import { Alert } from "react-native";
import Constants from "expo-constants";

import { SUPPORT_TOPICS, type SupportTopic } from "../logic/support-topics";

/**
 * Contact support's view model: what the message is about, its fields, and
 * whether it can be sent — an email and a message. Sending isn't wired up
 * yet, so Send says so rather than pretending.
 */
export function useContactSupport() {
  const [topic, setTopic] = useState<SupportTopic>("question");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const picked = SUPPORT_TOPICS.find((candidate) => candidate.value === topic) ?? SUPPORT_TOPICS[0];

  return {
    /** The topics as the filter row shows them; the one picked, by its label. */
    topics: SUPPORT_TOPICS.map(({ label }) => ({ label })),
    topicLabel: picked.label,
    pickTopic: (label: string) => {
      const next = SUPPORT_TOPICS.find((candidate) => candidate.label === label);
      if (next) setTopic(next.value);
    },
    prompt: picked.prompt,
    name: { value: name, onChangeText: setName },
    email: { value: email, onChangeText: setEmail },
    message: { value: message, onChangeText: setMessage },
    canSend: email.trim().length > 0 && message.trim().length > 0,
    version: Constants.expoConfig?.version ?? "",
    send: () => Alert.alert("Not sent yet", "Sending from the app isn't set up yet."),
  } as const;
}
