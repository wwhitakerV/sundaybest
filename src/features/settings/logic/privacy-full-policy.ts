import type { PrivacyTopic } from "./privacy-topic";

/**
 * The full privacy policy, read in the app. Plain words, held to what the app
 * and its server do today. Before release it still needs the company's name, a
 * privacy contact, and how long data is kept (docs/SETUP_CHECKLIST.md).
 */
export const FULL_PRIVACY_POLICY: PrivacyTopic = {
  id: "policy",
  title: "Complete policy",
  row: "The complete policy",
  statement: "Our complete privacy policy.",
  effective: "Effective October 7, 2026 · Privacy version 1.0",
  intro:
    "This policy explains what information SundayBest keeps, how it's used, and the choices you have.",
  numbered: true,
  sections: [
    {
      heading: "Who this covers",
      paragraphs: [
        "This policy covers the SundayBest app for iPhone and the service behind it. SundayBest doesn't ask you to create an account: it knows your copy of the app, not you.",
      ],
    },
    {
      heading: "What we keep",
      items: [
        {
          text: "An anonymous record of the app on your iPhone, with its version and your time zone.",
        },
        { text: "Your preferences, like your Bible translation, text size, and reminder." },
        { text: "The sermon links you add, their public details, and the plans built from them." },
        {
          text: "Your progress: the days and steps you've finished, and your Quick Check answers and scores.",
        },
      ],
    },
    {
      heading: "What stays on your iPhone",
      paragraphs: [
        "The answers you write to reflection questions are kept only on your iPhone, in SundayBest's encrypted storage, and are never sent to us.",
      ],
    },
    {
      heading: "What we never collect",
      items: [
        { text: "Your name, email address, or phone number." },
        { text: "Your contacts, photos, or location." },
        {
          text: "Your advertising identifier, or anything that follows you across other apps and websites.",
        },
      ],
    },
    {
      heading: "How we use it",
      paragraphs: [
        "We use what we keep to build your plans, show your progress, keep your preferences, and save your reminder's time and days. Your reminders are scheduled by iOS on your iPhone.",
      ],
    },
    {
      heading: "Sermons and transcripts",
      paragraphs: [
        "To write a plan, SundayBest fetches the transcript of the sermon you add and has an AI model write the study from it. Only the sermon is shared with these services, never anything about you. The transcript stays on our servers; your iPhone receives the plan and only the quotes it uses.",
        "Sermon searches are kept only by their words, never with anything about you.",
      ],
    },
    {
      heading: "Bible text and passage links",
      paragraphs: [
        "The Scripture in your plans, in the Berean Standard Bible or the King James Version, comes from SundayBest itself. Tapping a passage link opens it on Bible Gateway's website, where Bible Gateway's own privacy policy applies.",
      ],
    },
    {
      heading: "Security",
      items: [
        { text: "The app and SundayBest talk only over encrypted connections." },
        { text: "What SundayBest keeps on your iPhone is encrypted." },
        {
          text: "Your sign-in key is kept in your iPhone's Keychain, and each session is tied to your iPhone, so a copied key can't be used anywhere else.",
        },
      ],
    },
    {
      heading: "Crash reports",
      paragraphs: [
        "Where crash reporting is on, a crash can send a report to Sentry, the service we use to find and fix problems. Anything that could identify you is removed before the report leaves your iPhone, and SundayBest works the same without it.",
      ],
    },
    {
      heading: "Other services",
      items: [
        { text: "YouTube, where the sermons you add are hosted." },
        {
          text: "A transcript service and an AI model, which receive only the sermon, to build your plan.",
        },
        { text: "Bible Gateway, when you tap a passage link." },
        { text: "Sentry, for crash reports, where crash reporting is on." },
      ],
    },
    {
      heading: "What we never do",
      items: [
        { text: "Sell or rent your information." },
        { text: "Show you ads, or use your information for advertising." },
        { text: "Track you across other apps and websites." },
      ],
    },
    {
      heading: "Your choices",
      items: [
        { text: "Change your Bible translation, text size, and reminder in Settings at any time." },
        {
          text: "Reset a plan from its More menu; this also clears that plan's reflections from your iPhone.",
        },
        {
          text: "Turn reminders off in Settings, or stop SundayBest's notifications in your iPhone's Settings app.",
        },
        { text: "Removing SundayBest from your iPhone removes your reflections with it." },
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: ["If this policy changes, we'll update it here and change the date at the top."],
    },
    {
      heading: "Questions",
      paragraphs: ["You can reach us from Contact support in Settings."],
    },
  ],
};
