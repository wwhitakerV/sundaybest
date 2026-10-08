import type { PrivacyTopicId } from "./privacy-routes";

/** A setting a privacy page can take the reader straight to. */
export type PrivacySettingHref =
  | "/(tabs)/settings/daily-reminder"
  | "/(tabs)/settings/bible-translation"
  | "/(tabs)/settings/text-size";

/** One thing a section sets out: what it is, then what it means. A plain line has no name. */
type PrivacyItem = { label?: string; text: string };

/** One part of a privacy page: a heading over a few short paragraphs, named items, or both. */
export type PrivacySection = {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly PrivacyItem[];
  /** Small buttons to the setting the section talks about, where there's a real one. */
  actions?: readonly { label: string; href: PrivacySettingHref }[];
};

/** A privacy page: how the short version lists it, and what it says when opened. */
export type PrivacyTopic = {
  id: PrivacyTopicId;
  /** The page's name in the bar. */
  title: string;
  /** How the short version lists it. The complete policy has its own link instead. */
  row?: string;
  /** The small red label above the statement: "Privacy / 01". */
  eyebrow: string;
  /** The page's one serif line. */
  statement: string;
  /** A line or two in plain words under it. */
  intro: string;
  /** One strong statement, featured in serif. */
  quote?: string;
  /** When the complete policy took effect, and its version. */
  effective?: string;
  /** Whether its sections are numbered, as a document's are. */
  numbered?: boolean;
  sections: readonly PrivacySection[];
};
