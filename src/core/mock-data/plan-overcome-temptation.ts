import type { LibraryItem, Plan, Quiz, QuizQuestion } from "@/types/domain";

import { makeDayRecords } from "./plan-day-records";
import { makeChoices } from "./quiz-choices";
import { SERMON_TEMPTATION } from "./sermons";
import { MOCK_SETTINGS, MOCK_USER } from "./user";

/**
 * A saved plan: a single day from "Overcome Temptation", built and saved to
 * the library for later. Not started; its Quick Check hasn't been taken.
 */

const BUILT_AT = "2026-09-19T21:11:00.000Z";

export const PLAN_TEMPTATION: Plan = {
  id: "plan-overcome-temptation",
  createdAt: "2026-09-19T21:10:00.000Z",
  updatedAt: BUILT_AT,
  userId: MOCK_USER.id,
  sermonId: SERMON_TEMPTATION.id,
  title: "Overcome Temptation",
  status: "ready",
  lengthDays: 1,
  quickCheckEnabled: true,
  startDate: null,
  startedAt: null,
  completedAt: null,
  archivedAt: null,
  isSample: false,
};

const RECORDS = makeDayRecords(PLAN_TEMPTATION, BUILT_AT, MOCK_SETTINGS.bibleTranslation, {
  dayNumber: 1,
  title: "Come and rest",
  status: "available",
  paragraphs: [
    "Jesus doesn't invite the strong and the finished. He invites the weary and the burdened.",
    "His yoke isn't the absence of work; it's work shared with Someone stronger, who is gentle with us.",
  ],
  sermonQuote: "A yoke isn't the absence of work. It's work shared with someone stronger.",
  sermonClip: { startSeconds: 734, endSeconds: 850 },
  passage: {
    reference: "Matthew 11:28–30",
    book: "Matthew",
    chapter: 11,
    verses: [
      {
        number: 28,
        text: "“Come to me, all you who are weary and burdened, and I will give you rest.",
      },
      {
        number: 29,
        text: "Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.",
      },
      { number: 30, text: "For my yoke is easy and my burden is light.”" },
    ],
  },
  reflections: [{ question: "What are you carrying that Jesus is asking you to share?" }],
  prayer: {
    text: "Jesus, I'm tired. I come to You as I am. Teach me to rest in You. Amen.",
  },
  completedSteps: [],
  scheduledOn: null,
  startedAt: null,
  completedAt: null,
});

export const TEMPTATION_DAYS = [RECORDS.day];
export const TEMPTATION_SCRIPTURE = [RECORDS.scripture];
export const TEMPTATION_REFLECTIONS = RECORDS.reflections;
export const TEMPTATION_PRAYERS = [RECORDS.prayer];

/** Saved for later — the Plans tab's "Saved". */
export const TEMPTATION_SAVED: LibraryItem = {
  id: `library-${PLAN_TEMPTATION.id}`,
  createdAt: "2026-09-19T21:12:00.000Z",
  updatedAt: "2026-09-19T21:12:00.000Z",
  userId: MOCK_USER.id,
  kind: "plan",
  itemId: PLAN_TEMPTATION.id,
  savedAt: "2026-09-19T21:12:00.000Z",
  note: "For a Sunday afternoon.",
};

// ---------------------------------------------------------------------------
// Quick Check — not taken yet, so every question is unanswered
// ---------------------------------------------------------------------------

const QUIZ: Quiz = {
  id: `${PLAN_TEMPTATION.id}-quiz`,
  createdAt: BUILT_AT,
  updatedAt: BUILT_AT,
  planId: PLAN_TEMPTATION.id,
  planDayId: RECORDS.day.id,
  title: "Overcome Temptation quick check",
};

const Q1 = `${QUIZ.id}-q1`;
const Q2 = `${QUIZ.id}-q2`;

export const TEMPTATION_QUIZZES: Quiz[] = [QUIZ];
export const TEMPTATION_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: Q1,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ.id,
    order: 1,
    kind: "multipleChoice",
    source: "scripture",
    prompt: "Who does Jesus invite in Matthew 11:28?",
    choices: makeChoices(Q1, [
      "Those who have it all together",
      "All who are weary and burdened",
      "Only His twelve disciples",
      "The teachers of the law",
    ]),
    correctChoiceId: `${Q1}-b`,
    explanation: "“Come to me, all you who are weary and burdened, and I will give you rest.”",
    scriptureReference: "Matthew 11:28",
  },
  {
    id: Q2,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ.id,
    order: 2,
    kind: "multipleChoice",
    source: "sermon",
    prompt: "According to the sermon, what is a yoke?",
    choices: makeChoices(Q2, [
      "A punishment for the lazy",
      "Work shared with someone stronger",
      "The absence of all work",
      "A rule to be kept perfectly",
    ]),
    correctChoiceId: `${Q2}-b`,
    explanation: "“A yoke isn't the absence of work. It's work shared with someone stronger.”",
    scriptureReference: "Matthew 11:29–30",
  },
];
