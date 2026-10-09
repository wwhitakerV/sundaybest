import type { AboutSectionContent } from "./about-section";
import type { PrivacyTopicId } from "./privacy-routes";

/** A privacy page: how the short version lists it, and what it says when opened. */
export type PrivacyTopic = {
  id: PrivacyTopicId;
  /** The page's name in the bar. */
  title: string;
  /** How Privacy policy's details list it. */
  row: string;
  /** The page's one large line. */
  statement: string;
  /** A line or two in plain words under it. */
  intro: string;
  /** One strong statement, featured beside a red rule. */
  quote?: string;
  /** When the complete policy took effect, and its version. */
  effective?: string;
  /** Whether its sections are numbered, as a document's are. */
  numbered?: boolean;
  sections: readonly AboutSectionContent[];
};
