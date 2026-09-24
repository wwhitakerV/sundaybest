import type { Plan } from "@/types/domain";

import { makeDayRecords, type MockDayInput } from "./plan-day-records";
import { SERMON_SAMPLE } from "./sermons";
import { MOCK_SETTINGS, MOCK_USER } from "./user";

/** The sample plan's ID — what Welcome's "See a sample plan" and an empty Home open. */
export const SAMPLE_PLAN_ID = "sample-plan";

/**
 * The sample plan: five days from "God Won't Leave You", ready for anyone to
 * try — it starts the first time a day of it is studied. No Quick Check.
 */

const BUILT_AT = "2026-08-01T12:01:00.000Z";

export const PLAN_SAMPLE: Plan = {
  id: SAMPLE_PLAN_ID,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: BUILT_AT,
  userId: MOCK_USER.id,
  sermonId: SERMON_SAMPLE.id,
  title: "God Won't Leave You",
  status: "ready",
  lengthDays: 5,
  quickCheckEnabled: false,
  startDate: null,
  startedAt: null,
  completedAt: null,
  archivedAt: null,
  isSample: true,
};

const NOT_STARTED = {
  completedSteps: [],
  scheduledOn: null,
  startedAt: null,
  completedAt: null,
} as const;

const DAYS: MockDayInput[] = [
  {
    ...NOT_STARTED,
    completedSteps: [],
    dayNumber: 1,
    title: "Not left",
    status: "available",
    paragraphs: [
      "Moses is about to leave the people he's led for forty years. His last word to them is a promise that isn't his to keep — it's God's.",
      "Feeling alone and being left are two different things. God doesn't leave.",
    ],
    sermonQuote: "You might feel alone. You are not left. Those are two different things.",
    sermonClip: { startSeconds: 1_020, endSeconds: 1_140 },
    passage: {
      reference: "Deuteronomy 31:6",
      book: "Deuteronomy",
      chapter: 31,
      verses: [
        {
          number: 6,
          text: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you; he will never leave you nor forsake you.",
        },
      ],
    },
    reflections: [{ question: "Where have you felt most alone lately?" }],
    prayer: {
      text: "God, when I feel alone, remind me that You haven't gone anywhere. Amen.",
    },
  },
  {
    ...NOT_STARTED,
    completedSteps: [],
    dayNumber: 2,
    title: "Content with Him",
    status: "locked",
    paragraphs: [
      "Hebrews ties contentment to one promise: never will I leave you. Enough isn't a number; it's a Presence.",
      "When we're sure He stays, we can stop grasping for everything else.",
    ],
    sermonQuote: "Contentment isn't having enough. It's knowing who stays.",
    sermonClip: { startSeconds: 1_300, endSeconds: 1_410 },
    passage: {
      reference: "Hebrews 13:5",
      book: "Hebrews",
      chapter: 13,
      verses: [
        {
          number: 5,
          text: "Keep your lives free from the love of money and be content with what you have, because God has said, “Never will I leave you; never will I forsake you.”",
        },
      ],
    },
    reflections: [{ question: "What are you holding onto for security?" }],
    prayer: {
      text: "Lord, You are enough. Teach me to be content because You stay. Amen.",
    },
  },
  {
    ...NOT_STARTED,
    completedSteps: [],
    dayNumber: 3,
    title: "In the dark valley",
    status: "locked",
    paragraphs: [
      "David doesn't say he'll avoid the darkest valley. He says he won't be alone in it.",
      "The Shepherd is closest exactly where the path is hardest.",
    ],
    sermonQuote: "The valley is real. So is the Shepherd.",
    sermonClip: { startSeconds: 1_520, endSeconds: 1_640 },
    passage: {
      reference: "Psalm 23:4",
      book: "Psalm",
      chapter: 23,
      verses: [
        {
          number: 4,
          text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
        },
      ],
    },
    reflections: [{ question: "What valley are you walking through?" }],
    prayer: {
      text: "Shepherd, walk with me through this valley. I won't fear, because You're here. Amen.",
    },
  },
  {
    ...NOT_STARTED,
    completedSteps: [],
    dayNumber: 4,
    title: "Always",
    status: "locked",
    paragraphs: [
      "Jesus' last words in Matthew aren't a command to go alone. They're a promise to go with.",
      "“Always” covers the good days and the ordinary ones — including this one.",
    ],
    sermonQuote: "Always means today, too.",
    sermonClip: { startSeconds: 1_760, endSeconds: 1_860 },
    passage: {
      reference: "Matthew 28:20",
      book: "Matthew",
      chapter: 28,
      verses: [
        {
          number: 20,
          text: "and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.",
        },
      ],
    },
    reflections: [{ question: "How would today change if you remembered He's with you?" }],
    prayer: {
      text: "Jesus, thank You for being with me always — today included. Amen.",
    },
  },
  {
    ...NOT_STARTED,
    completedSteps: [],
    dayNumber: 5,
    title: "Nothing can separate",
    status: "locked",
    paragraphs: [
      "Paul lists everything that might come between us and God — and rules every one of them out.",
      "His love isn't held in place by us. That's why it holds.",
    ],
    sermonQuote: "Nothing you face is bigger than the love that holds you.",
    sermonClip: { startSeconds: 2_010, endSeconds: 2_130 },
    passage: {
      reference: "Romans 8:38–39",
      book: "Romans",
      chapter: 8,
      verses: [
        {
          number: 38,
          text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers,",
        },
        {
          number: 39,
          text: "neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.",
        },
      ],
    },
    reflections: [{ question: "What have you feared could separate you from God?" }],
    prayer: {
      text: "Father, nothing can separate me from Your love. Let that settle deep in me. Amen.",
    },
  },
];

const RECORDS = DAYS.map((input) =>
  makeDayRecords(PLAN_SAMPLE, BUILT_AT, MOCK_SETTINGS.bibleTranslation, input),
);

export const SAMPLE_DAYS = RECORDS.map((records) => records.day);
export const SAMPLE_SCRIPTURE = RECORDS.map((records) => records.scripture);
export const SAMPLE_REFLECTIONS = RECORDS.flatMap((records) => records.reflections);
export const SAMPLE_PRAYERS = RECORDS.map((records) => records.prayer);
