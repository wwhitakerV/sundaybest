/** A setting an About page can take the reader straight to. */
export type AboutSettingHref =
  | "/(tabs)/settings/daily-reminder"
  | "/(tabs)/settings/bible-translation"
  | "/(tabs)/settings/text-size";

/** One thing a section sets out: what it is, then what it means. A plain line has no name. */
type AboutItem = { label?: string; text: string };

/** One part of an About page: a heading over a few short paragraphs, named items, or both. */
export type AboutSectionContent = {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly AboutItem[];
  /** Rows to the setting the section talks about, where there's a real one, named as Settings names it. */
  actions?: readonly { label: string; href: AboutSettingHref }[];
};
