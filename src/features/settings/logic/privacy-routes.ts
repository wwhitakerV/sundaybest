import { z } from "zod";

/** Privacy policy's pages: the short version's four, then the complete policy. */
const PRIVACY_TOPIC_IDS = ["keep", "device", "use", "controls", "policy"] as const;

export type PrivacyTopicId = (typeof PRIVACY_TOPIC_IDS)[number];

const privacyTopicParamsSchema = z.object({ topic: z.enum(PRIVACY_TOPIC_IDS) });

/** The topic a privacy page's route asks for — untrusted, so parsed — or null if it isn't one. */
export function parsePrivacyTopicParams(params: unknown): PrivacyTopicId | null {
  const parsed = privacyTopicParamsSchema.safeParse(params);
  return parsed.success ? parsed.data.topic : null;
}
