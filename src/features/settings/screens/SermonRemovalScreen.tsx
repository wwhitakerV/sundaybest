import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Flag, Link2, MailCheck, ShieldCheck } from "lucide-react-native";

import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { Card } from "@/ui/atoms/Card";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsFormField } from "../components/SettingsFormField";
import { SettingsHeroCard } from "../components/SettingsHeroCard";
import { SettingsInfoBlock } from "../components/SettingsInfoBlock";
import { SettingsSubpage } from "../components/SettingsSubpage";

export function SermonRemovalScreen() {
  const [church, setChurch] = useState("");
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const canSubmit = church.trim().length > 0 && link.trim().length > 0 && email.trim().length > 0;

  function submit() {
    Alert.alert(
      "Removal transport not configured",
      "This form is designed and validated locally, but the uploaded source did not include a sermon-removal endpoint or destination email. Connect that transport before release.",
    );
  }

  return (
    <SettingsSubpage testID="sermon-removal" title="Request sermon removal">
      <SettingsHeroCard
        testID="sermon-removal-hero"
        icon={Flag}
        eyebrow="For churches"
        title="A direct path to removal."
        detail="If your church does not want a sermon used in SundayBest, send enough information to identify the source and verify who we should follow up with."
        accent
      />

      <View style={{ gap: space[12] }}>
        <SettingsInfoBlock
          icon={Link2}
          title="Identify the sermon"
          body="Paste the original sermon link or the SundayBest plan link that points to it."
        />
        <SettingsInfoBlock
          icon={MailCheck}
          title="Give us a church contact"
          body="Use an email address someone at the church can access in case the request needs verification."
        />
        <SettingsInfoBlock
          icon={ShieldCheck}
          title="Keep the request specific"
          body="One sermon per request keeps the source, church, and follow-up clear."
        />
      </View>

      <Card radius={28} style={[styles.form, { gap: space[18], padding: space[18] }]}>
        <MonoBody variant="supporting" tone="textMuted">
          REMOVAL REQUEST
        </MonoBody>
        <SettingsFormField
          testID="sermon-removal-church"
          label="Church name"
          value={church}
          onChangeText={setChurch}
          placeholder="Church name"
          autoCapitalize="words"
        />
        <SettingsFormField
          testID="sermon-removal-link"
          label="Sermon or plan link"
          value={link}
          onChangeText={setLink}
          placeholder="https://…"
          keyboardType="url"
          autoCapitalize="none"
        />
        <SettingsFormField
          testID="sermon-removal-email"
          label="Contact email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@church.org"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <SettingsFormField
          testID="sermon-removal-reason"
          label="Reason (optional)"
          value={reason}
          onChangeText={setReason}
          placeholder="Anything we should know?"
          multiline
          maxLength={600}
        />
        <Button
          testID="sermon-removal-submit"
          label="Submit request"
          onPress={submit}
          disabled={!canSubmit}
        />
      </Card>

      <SFProBody variant="detail" tone="textSupporting">
        Do not include private member information or other sensitive data in this request.
      </SFProBody>
    </SettingsSubpage>
  );
}

const styles = StyleSheet.create({
  form: { borderWidth: 1 },
});
