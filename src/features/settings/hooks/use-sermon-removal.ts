import { useState } from "react";
import { Alert } from "react-native";

/**
 * Request sermon removal's view model: its fields, and whether it can be
 * sent — a church, a link, and an email. Sending isn't wired up yet, so
 * Submit says so rather than pretending.
 */
export function useSermonRemoval() {
  const [church, setChurch] = useState("");
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");

  return {
    church: { value: church, onChangeText: setChurch },
    link: { value: link, onChangeText: setLink },
    email: { value: email, onChangeText: setEmail },
    reason: { value: reason, onChangeText: setReason },
    canSubmit: [church, link, email].every((field) => field.trim().length > 0),
    submit: () => Alert.alert("Not sent yet", "Sending from the app isn't set up yet."),
  } as const;
}
