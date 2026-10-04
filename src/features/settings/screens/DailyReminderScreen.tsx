import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useRemindersQuery, useUpdateReminderMutation } from "@/core/api/queries";
import { requestNotificationPermission } from "@/core/notifications/request-notification-permission";
import { radius, space, useTheme } from "@/theme";
import type { Weekday } from "@/types/domain";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";
import { formatClockTime } from "@/utils/time/formatClockTime";
import { SettingsSubpage } from "../components/SettingsSubpage";

const DAYS: readonly { value: Weekday; label: string; accessibilityLabel: string }[] = [
  { value: "sun", label: "Sun", accessibilityLabel: "Sunday" },
  { value: "mon", label: "Mon", accessibilityLabel: "Monday" },
  { value: "tue", label: "Tue", accessibilityLabel: "Tuesday" },
  { value: "wed", label: "Wed", accessibilityLabel: "Wednesday" },
  { value: "thu", label: "Thu", accessibilityLabel: "Thursday" },
  { value: "fri", label: "Fri", accessibilityLabel: "Friday" },
  { value: "sat", label: "Sat", accessibilityLabel: "Saturday" },
];

export function DailyReminderScreen() {
  const theme = useTheme();
  const remindersQuery = useRemindersQuery();
  const update = useUpdateReminderMutation();
  const reminder = remindersQuery.data?.reminders.find((item) => item.kind === "dailyStudy");
  const [draftTime, setDraftTime] = useState<Date>(() => dateForTime("08:00"));

  useEffect(() => {
    if (reminder) setDraftTime(dateForTime(reminder.time));
  }, [reminder?.time]);

  async function toggleEnabled(enabled: boolean) {
    if (update.isPending) return;

    if (enabled) {
      let granted = false;
      try {
        granted = await requestNotificationPermission();
      } catch {
        granted = false;
      }

      if (!granted) {
        Alert.alert(
          "Notifications are off",
          "Allow notifications for SundayBest in iPhone Settings to use a daily reminder.",
        );
        return;
      }
    }

    update.mutate(
      { kind: "dailyStudy", input: { enabled } },
      { onError: () => Alert.alert("Couldn’t update reminder", "Try again in a moment.") },
    );
  }

  function changeTime(date: Date | undefined) {
    if (!date) return;
    setDraftTime(date);
    const time = toLocalTime(date);
    if (time === currentTime) return;
    update.mutate(
      { kind: "dailyStudy", input: { time } },
      { onError: () => Alert.alert("Couldn’t update reminder time", "Try again in a moment.") },
    );
  }

  function toggleDay(day: Weekday) {
    if (update.isPending) return;
    const selected = selectedDays.includes(day);
    if (selected && selectedDays.length === 1) return;

    const days = selected
      ? selectedDays.filter((candidate) => candidate !== day)
      : DAYS.map(({ value }) => value).filter(
          (candidate) => candidate === day || selectedDays.includes(candidate),
        );

    update.mutate(
      { kind: "dailyStudy", input: { days } },
      { onError: () => Alert.alert("Couldn’t update reminder days", "Try again in a moment.") },
    );
  }

  const enabled = reminder?.enabled ?? false;
  const currentTime = reminder?.time ?? "08:00";
  const selectedDays = reminder?.days ?? DAYS.map(({ value }) => value);

  return (
    <SettingsSubpage testID="daily-reminder" title="Daily reminder">
      <Card style={[styles.toggleCard, { gap: space[16], padding: space[18] }]}>
        <View style={[styles.toggleCopy, { gap: space[4] }]}>
          <SFProBody variant="listItem">Daily study reminder</SFProBody>
          <SFProBody variant="detail" tone="textMuted">
            A quiet nudge to return to today&apos;s study.
          </SFProBody>
        </View>
        <Switch
          testID="daily-reminder-enabled"
          accessibilityLabel="Daily study reminder"
          value={enabled}
          disabled={update.isPending}
          onValueChange={(value) => void toggleEnabled(value)}
          trackColor={{ true: theme.colors.controlPrimary, false: theme.colors.divider }}
          ios_backgroundColor={theme.colors.divider}
        />
      </Card>

      <View style={{ gap: space[8] }}>
        <SFProBody variant="label" tone="textMuted" style={styles.sectionLabel}>
          TIME
        </SFProBody>
        <Card style={[styles.timeCard, { paddingHorizontal: space[18], paddingVertical: space[12] }]}>
          <View style={[styles.toggleCopy, { gap: space[2] }]}>
            <SFProBody variant="listItem">Remind me at</SFProBody>
            <SFProBody variant="detail" tone="textMuted">
              {formatClockTime(currentTime)}
            </SFProBody>
          </View>
          <DateTimePicker
            testID="daily-reminder-time-picker"
            value={draftTime}
            mode="time"
            display="compact"
            disabled={!enabled || update.isPending}
            onChange={(_event, date) => changeTime(date)}
            accentColor={theme.colors.accent}
          />
        </Card>
      </View>

      <View style={{ gap: space[8] }}>
        <SFProBody variant="label" tone="textMuted" style={styles.sectionLabel}>
          DAYS
        </SFProBody>
        <View testID="daily-reminder-days" style={[styles.days, { gap: space[8] }]}>
          {DAYS.map((day) => {
            const selected = selectedDays.includes(day.value);
            return (
              <Pressable
                key={day.value}
                testID={`daily-reminder-day-${day.value}`}
                accessibilityRole="checkbox"
                accessibilityLabel={day.accessibilityLabel}
                accessibilityState={{ checked: selected, disabled: !enabled }}
                disabled={!enabled || update.isPending}
                onPress={() => toggleDay(day.value)}
                style={[
                  styles.day,
                  {
                    backgroundColor: selected
                      ? theme.colors.segmentActiveBackground
                      : theme.colors.background,
                    borderColor: selected ? theme.colors.borderStrong : theme.colors.hairline,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <SFProBody variant="label" tone={selected ? "text" : "textMuted"}>
                  {day.label}
                </SFProBody>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SFProBody variant="detail" tone="textMuted">
        Reminders are scheduled on this iPhone. Your time and day preferences stay synced with your SundayBest profile.
      </SFProBody>
    </SettingsSubpage>
  );
}

function dateForTime(time: string): Date {
  const [hour = "8", minute = "0"] = time.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date;
}

function toLocalTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  toggleCard: { flexDirection: "row", alignItems: "center" },
  toggleCopy: { flex: 1 },
  sectionLabel: { paddingHorizontal: space[4] },
  timeCard: { minHeight: 68, flexDirection: "row", alignItems: "center" },
  days: { flexDirection: "row", flexWrap: "wrap" },
  day: {
    minWidth: 58,
    height: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[12],
  },
});
