export type SettingsRow = {
  testID: string;
  label: string;
  /** Where the row goes. Omitted for rows with no destination yet. */
  href?:
    | "/(tabs)/settings/daily-reminder"
    | "/(tabs)/settings/bible-translation"
    | "/(tabs)/settings/text-size"
    | "/(tabs)/settings/how-plans-are-made"
    | "/(tabs)/settings/privacy-policy";
};

/** The Settings list, top to bottom. */
export const SETTINGS_ROWS: readonly SettingsRow[] = [
  {
    testID: "settings-daily-reminder-row",
    label: "Daily reminder",
    href: "/(tabs)/settings/daily-reminder",
  },
  {
    testID: "settings-bible-translation-row",
    label: "Bible translation",
    href: "/(tabs)/settings/bible-translation",
  },
  { testID: "settings-text-size-row", label: "Text size", href: "/(tabs)/settings/text-size" },
  {
    testID: "settings-how-plans-are-made-row",
    label: "How plans are made",
    href: "/(tabs)/settings/how-plans-are-made",
  },
  {
    testID: "settings-privacy-policy-row",
    label: "Privacy policy",
    href: "/(tabs)/settings/privacy-policy",
  },
  // Mocked action only — no destination exists for this yet, per spec.
  { testID: "settings-contact-support-row", label: "Contact support" },
];
