import { FULL_PRIVACY_POLICY } from "./privacy-full-policy";
import type { PrivacyTopic } from "./privacy-topic";

/**
 * Privacy policy's words: its landing page, and each page it opens. Every line
 * is held to what the app and its server actually do today — check it against
 * the code before changing it, and say nothing it doesn't do yet.
 */
export const PRIVACY_LANDING = {
  eyebrow: "Privacy at SundayBest",
  statement: "Your study belongs to you.",
  intro: "SundayBest keeps only what it needs to build your plans and remember your progress.",
  promises: ["No account required", "Reflections stay on your iPhone", "No ads or tracking"],
  shortVersion: "The short version",
  complete: "Read the complete privacy policy",
} as const;

const KEEP: PrivacyTopic = {
  id: "keep",
  title: "What we keep",
  row: "What we keep",
  eyebrow: "Privacy / 01",
  statement: "What SundayBest keeps.",
  intro:
    "Only what's needed to build your plans, remember your progress, and keep your preferences the way you set them.",
  quote: "We don't need your name, email, or identity to make SundayBest work.",
  sections: [
    {
      heading: "Stored by SundayBest",
      items: [
        {
          label: "Plan source",
          text: "The sermon links you add, their public details, and the study plans built from them.",
        },
        {
          label: "Study progress",
          text: "The days and steps you've finished, and your Quick Check answers and scores.",
        },
        {
          label: "Preferences",
          text: "Your Bible translation, text size, and reminder.",
        },
        {
          label: "This app",
          text: "An anonymous record of the app on your iPhone, with its version and your time zone.",
        },
      ],
    },
    {
      heading: "Never collected",
      items: [
        { label: "Who you are", text: "Your name, email address, or phone number." },
        { label: "What's on your iPhone", text: "Your contacts, photos, or location." },
        {
          label: "Tracking",
          text: "Your advertising identifier, or anything that follows you across other apps and websites.",
        },
      ],
    },
  ],
};

const DEVICE: PrivacyTopic = {
  id: "device",
  title: "What stays on your iPhone",
  row: "What stays on your iPhone",
  eyebrow: "Privacy / 02",
  statement: "What stays on your iPhone.",
  intro: "Some of what you do in SundayBest never leaves your iPhone at all.",
  quote: "The reflections you write are yours alone. They're never sent to us.",
  sections: [
    {
      heading: "On this iPhone only",
      items: [
        {
          label: "Reflections",
          text: "Your written answers to reflection questions, kept in SundayBest's encrypted storage.",
        },
        {
          label: "Sign-in key",
          text: "The key that keeps your session yours, held in your iPhone's Keychain.",
        },
      ],
    },
    {
      heading: "Clearing them",
      paragraphs: [
        "Resetting a plan clears the reflections you wrote for it; your other plans' reflections stay as they are. Removing SundayBest from your iPhone removes your reflections with it.",
      ],
    },
  ],
};

const USE: PrivacyTopic = {
  id: "use",
  title: "How we use your data",
  row: "How we use your data",
  eyebrow: "Privacy / 03",
  statement: "How your data is used.",
  intro: "Everything SundayBest keeps is used to run SundayBest for you, and for nothing else.",
  quote: "We never sell your information, show you ads, or track you across other apps.",
  sections: [
    {
      heading: "Running SundayBest",
      items: [
        { label: "Your plans", text: "Built from the sermons you add." },
        { label: "Your progress", text: "Used to show you where you left off." },
        { label: "Your preferences", text: "Saved so SundayBest reads the way you set it." },
        {
          label: "Reminders",
          text: "Your reminder's time and days are saved; iOS schedules the reminder itself, on your iPhone.",
        },
      ],
    },
    {
      heading: "Building a plan",
      paragraphs: [
        "To write a plan, SundayBest fetches the sermon's transcript and has an AI model write the study from it. Only the sermon is shared with these services, never anything about you.",
        "The transcript stays on our servers. Your iPhone receives the plan, and only the quotes it uses.",
      ],
    },
    {
      heading: "Scripture",
      paragraphs: [
        "The Bible text in your plans, in the Berean Standard Bible or the King James Version, comes from SundayBest itself. Tapping a passage link opens it on Bible Gateway's website, where their own privacy policy applies.",
      ],
    },
    {
      heading: "Crash reports",
      paragraphs: [
        "If the app crashes, it can send us a report so we can fix the problem. Anything that could identify you is removed before the report leaves your iPhone.",
      ],
    },
  ],
};

const CONTROLS: PrivacyTopic = {
  id: "controls",
  title: "Your controls",
  row: "Your controls",
  eyebrow: "Privacy / 04",
  statement: "You're in control.",
  intro: "You decide how SundayBest works for you, and you can change your mind at any time.",
  sections: [
    {
      heading: "Preferences",
      paragraphs: ["Change your Bible translation, reading size, or reminders whenever you want."],
      actions: [
        { label: "Open Bible translation", href: "/(tabs)/settings/bible-translation" },
        { label: "Open text size", href: "/(tabs)/settings/text-size" },
      ],
    },
    {
      heading: "Resetting a plan",
      paragraphs: [
        "Start a plan over from its More menu. Its reflections are cleared from your iPhone; your other plans' reflections stay as they are.",
      ],
    },
    {
      heading: "Notifications",
      paragraphs: [
        "Turn SundayBest's reminders off in the app, or stop its notifications in your iPhone's Settings.",
      ],
      actions: [{ label: "Open reminder settings", href: "/(tabs)/settings/daily-reminder" }],
    },
  ],
};

/** Privacy policy's pages, in order: the short version's four, then the complete policy. */
export const PRIVACY_TOPICS: readonly PrivacyTopic[] = [
  KEEP,
  DEVICE,
  USE,
  CONTROLS,
  FULL_PRIVACY_POLICY,
];
