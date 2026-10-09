import type { AboutSectionContent } from "./about-section";

/**
 * How plans are made, in words: what happens between choosing a sermon and
 * opening day one. Every line is held to what SundayBest actually does, and
 * says what happens without naming the services, models, or instructions
 * behind it.
 */
export const HOW_PLANS_ARE_MADE = {
  statement: "From Sunday's sermon to your study plan.",
  intro: "What happens between choosing a sermon and opening day one, in five steps.",
  steps: [
    {
      icon: "sermon",
      heading: "You choose a sermon",
      text: "Paste a YouTube link or search by title. SundayBest looks up the sermon's public details: its title, church, and length.",
    },
    {
      icon: "scripture",
      heading: "We make sure it's built on Scripture",
      text: "Before anything is written, SundayBest checks the message is built on the Bible, looking for the passages it names and quotes. A video that isn't a sermon on Scripture stops here.",
    },
    {
      icon: "transcript",
      heading: "We read the whole message",
      text: "SundayBest reads the transcript start to finish, and finds the passages the sermon is built on and the idea that runs through it.",
    },
    {
      icon: "days",
      heading: "Your days are written",
      text: "The message is shared across the days you chose, an idea a day: a reading from the sermon, the passage, questions to reflect on, and a prayer. Every part is checked, and rewritten if it falls short.",
    },
    {
      icon: "quickCheck",
      heading: "Your Quick Check is built",
      text: "Seven to ten questions a day, from the sermon and from Scripture. Finish-the-verse questions use the verse's exact words, so the right answer is always the Bible's own.",
    },
  ],
  quote:
    "Scripture is never rewritten. Every verse is the Bible's own words, in the translation you choose.",
  truths: {
    heading: "What stays true",
    items: [
      { label: "The sermon leads", text: "Each day's idea is drawn from the message itself." },
      {
        label: "Scripture, word for word",
        text: "Passages and verses come from the translation you choose, never reworded.",
      },
      {
        label: "Checked before you see it",
        text: "Every part of a plan is checked before it's kept.",
      },
      { label: "Your reflections stay yours", text: "What you write stays on your iPhone." },
    ],
  } satisfies AboutSectionContent,
  privacyLink: "How we handle your data",
} as const;
