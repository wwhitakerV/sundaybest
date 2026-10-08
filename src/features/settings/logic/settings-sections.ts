import type { BibleTranslation, TextSize } from "@/types/domain";
import { formatClockTime } from "@/utils/time/formatClockTime";

/** Which mark a row's badge holds. */
export type SettingsIcon = "bell" | "book" | "type" | "sparkles" | "shield" | "mail" | "flag";

export type SettingsRow = {
  testID: string;
  label: string;
  icon: SettingsIcon;
  /** Its current value, said beside it — "6:30 AM", "BSB" — if it has one. */
  value?: string;
  /** Where the row goes. Omitted for rows with no destination yet. */
  href?:
    | "/(tabs)/settings/daily-reminder"
    | "/(tabs)/settings/bible-translation"
    | "/(tabs)/settings/text-size"
    | "/(tabs)/settings/how-plans-are-made"
    | "/(tabs)/settings/privacy-policy"
    | "/(tabs)/settings/contact-support"
    | "/(tabs)/settings/sermon-removal";
};

function formatTextSize(textSize: TextSize): string {
  switch (textSize) {
    case "small":
      return "Small";
    case "default":
      return "Default";
    case "large":
      return "Large";
    case "extraLarge":
      return "Extra large";
  }
}

/**
 * Settings, grouped: the user's routine — each with its value — then about
 * the app, then for churches.
 */
export function describeSettingsSections({
  reminderTime,
  translation,
  textSize,
  twentyFourHour = false,
}: {
  /** The daily reminder's time, or null when it's off. */
  reminderTime: string | null;
  translation: BibleTranslation;
  textSize: TextSize;
  /** Whether the iPhone writes times on a 24-hour clock, as the reminder's own time pill does. */
  twentyFourHour?: boolean;
}): { title: string; rows: SettingsRow[] }[] {
  return [
    {
      title: "Your routine",
      rows: [
        {
          testID: "settings-daily-reminder-row",
          label: "Daily reminder",
          icon: "bell",
          value: reminderTime ? formatClockTime(reminderTime, { twentyFourHour }) : "Off",
          href: "/(tabs)/settings/daily-reminder",
        },
        {
          testID: "settings-bible-translation-row",
          label: "Bible translation",
          icon: "book",
          value: translation,
          href: "/(tabs)/settings/bible-translation",
        },
        {
          testID: "settings-text-size-row",
          label: "Text size",
          icon: "type",
          value: formatTextSize(textSize),
          href: "/(tabs)/settings/text-size",
        },
      ],
    },
    {
      title: "About",
      rows: [
        {
          testID: "settings-how-plans-are-made-row",
          label: "How plans are made",
          icon: "sparkles",
          href: "/(tabs)/settings/how-plans-are-made",
        },
        {
          testID: "settings-privacy-policy-row",
          label: "Privacy policy",
          icon: "shield",
          href: "/(tabs)/settings/privacy-policy",
        },
        {
          testID: "settings-contact-support-row",
          label: "Contact support",
          icon: "mail",
          href: "/(tabs)/settings/contact-support",
        },
      ],
    },
    {
      title: "For churches",
      rows: [
        {
          testID: "settings-sermon-removal-row",
          label: "Request sermon removal",
          icon: "flag",
          href: "/(tabs)/settings/sermon-removal",
        },
      ],
    },
  ];
}

/** A version as the footer says it: "1.0.0" → "1.0"; "1.2.3" stays. */
export function formatShortVersion(version: string): string {
  return version.replace(/\.0$/, "");
}
