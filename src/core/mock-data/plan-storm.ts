import type { Plan } from "@/types/domain";

import { makeDayRecords, type MockDayInput } from "./plan-day-records";
import { SERMON_STORM } from "./sermons";
import { MOCK_SETTINGS, MOCK_USER } from "./user";

/**
 * A ready plan: three days from "Faith Through the Storm", built on Sunday
 * and not started. Day 1 is open; the rest wait their turn. No Quick Check.
 */

const BUILT_AT = "2026-09-20T15:01:20.000Z";

export const PLAN_STORM: Plan = {
  id: "plan-faith-through-the-storm",
  createdAt: "2026-09-20T15:00:00.000Z",
  updatedAt: BUILT_AT,
  userId: MOCK_USER.id,
  sermonId: SERMON_STORM.id,
  title: "Faith Through the Storm",
  status: "ready",
  lengthDays: 3,
  quickCheckEnabled: false,
  startDate: null,
  startedAt: null,
  completedAt: null,
  archivedAt: null,
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
    title: "Asleep in the boat",
    status: "available",
    paragraphs: [
      "The disciples were in a storm with Jesus in the boat — and He was asleep.",
      "His calm wasn't carelessness. It was trust. And one word from Him stilled the sea.",
    ],
    sermonQuote: "Jesus is asleep in the same boat they think is sinking.",
    sermonClip: { startSeconds: 640, endSeconds: 760 },
    passage: {
      reference: "Mark 4:39",
      book: "Mark",
      chapter: 4,
      verses: [
        {
          number: 39,
          text: "He got up, rebuked the wind and said to the waves, “Quiet! Be still!” Then the wind died down and it was completely calm.",
        },
      ],
    },
    reflections: [{ question: "What storm are you in the middle of right now?" }],
    prayer: {
      text: "Jesus, You're in the boat with me. Speak Your peace over what feels out of control. Amen.",
    },
  },
  {
    ...NOT_STARTED,
    completedSteps: [],
    dayNumber: 2,
    title: "A refuge",
    status: "locked",
    paragraphs: [
      "God isn't a distant rescuer. The psalm calls Him an ever-present help — here, now, in trouble.",
      "A refuge is somewhere you run to, not somewhere you only visit when things are calm.",
    ],
    sermonQuote: "He's not the help you call after the storm. He's the shelter in it.",
    sermonClip: { startSeconds: 980, endSeconds: 1_080 },
    passage: {
      reference: "Psalm 46:1",
      book: "Psalm",
      chapter: 46,
      verses: [
        { number: 1, text: "God is our refuge and strength, an ever-present help in trouble." },
      ],
    },
    reflections: [{ question: "Where do you usually run when you're afraid?" }],
    prayer: {
      text: "God, be my refuge today. When I'm afraid, let me run to You first. Amen.",
    },
  },
  {
    ...NOT_STARTED,
    completedSteps: [],
    dayNumber: 3,
    title: "Through the waters",
    status: "locked",
    paragraphs: [
      "God doesn't promise we'll avoid deep water. He promises we won't go through it alone.",
      "“When,” not “if” — and every time, “I will be with you.”",
    ],
    sermonQuote:
      "He doesn't promise there won't be water. He promises you won't go through it alone.",
    sermonClip: { startSeconds: 1_310, endSeconds: 1_430 },
    passage: {
      reference: "Isaiah 43:2",
      book: "Isaiah",
      chapter: 43,
      verses: [
        {
          number: 2,
          text: "When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you. When you walk through the fire, you will not be burned; the flames will not set you ablaze.",
        },
      ],
    },
    reflections: [{ question: "How has God been with you in a past storm?" }],
    prayer: {
      text: "Lord, thank You that I never go through the waters alone. Hold me steady. Amen.",
    },
  },
];

const RECORDS = DAYS.map((input) =>
  makeDayRecords(PLAN_STORM, BUILT_AT, MOCK_SETTINGS.bibleTranslation, input),
);

export const STORM_DAYS = RECORDS.map((records) => records.day);
export const STORM_SCRIPTURE = RECORDS.map((records) => records.scripture);
export const STORM_REFLECTIONS = RECORDS.flatMap((records) => records.reflections);
export const STORM_PRAYERS = RECORDS.map((records) => records.prayer);
