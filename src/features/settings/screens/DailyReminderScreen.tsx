import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Reveal } from "@/ui/atoms/Reveal";
import { Toggle } from "@/ui/atoms/Toggle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { ReminderDays } from "../components/ReminderDays";
import { ReminderTime } from "../components/ReminderTime";
import { SettingsFootnote } from "../components/SettingsFootnote";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { useDailyReminder } from "../hooks/use-daily-reminder";

/** As tall as the switch's card, so the two rows match. */
const TIME_ROW = 68;

export function DailyReminderScreen() {
  const view = useDailyReminder();

  return (
    <SettingsSubpage
      testID="daily-reminder"
      title="Daily reminder"
      footnote={
        view.enabled && (
          <Reveal order={2}>
            <SettingsFootnote text="Reminders are scheduled on this iPhone. Your time and day preferences stay synced with your SundayBest profile." />
          </Reveal>
        )
      }
    >
      <Card style={[styles.row, { gap: space[16], padding: space[18] }]}>
        <View style={[styles.copy, { gap: space[4] }]}>
          <SFProBody>Daily study reminder</SFProBody>
          <SFProBody variant="rowDetail" tone="textSupporting">
            A quiet nudge to return to today&apos;s study.
          </SFProBody>
        </View>
        <Toggle
          testID="daily-reminder-enabled"
          accessibilityLabel="Daily study reminder"
          value={view.enabled}
          onValueChange={view.setEnabled}
        />
      </Card>

      {/* Only while it's on: the reminder's time and days cascade in below the switch. */}
      {view.enabled && (
        <>
          <Reveal order={0}>
            <Section label="TIME">
              <Card style={[styles.row, { paddingHorizontal: space[18], minHeight: TIME_ROW }]}>
                <SFProBody style={styles.copy}>Remind me at</SFProBody>
                <ReminderTime
                  testID="daily-reminder-time"
                  time={view.time}
                  onChange={view.setTime}
                />
              </Card>
            </Section>
          </Reveal>
          <Reveal order={1}>
            <Section label="DAYS">
              <ReminderDays
                testID="daily-reminder-days"
                selected={view.days}
                onToggle={view.toggleDay}
              />
            </Section>
          </Reveal>
        </>
      )}
    </SettingsSubpage>
  );
}

/** A labelled group: its label in small capitals above its card. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: space[8] }}>
      <SFProBody variant="label" tone="textMuted" style={styles.sectionLabel}>
        {label}
      </SFProBody>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  copy: { flex: 1 },
  sectionLabel: { paddingHorizontal: space[4] },
});
