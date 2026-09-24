import type { Plan, Quiz, QuizAnswer, QuizAttempt, QuizQuestion } from "@/types/domain";

import { ALL_STEPS, makeDayRecords, type MockDayInput } from "./plan-day-records";
import { makeChoices } from "./quiz-choices";
import { SERMON_CHOOSE } from "./sermons";
import { MOCK_SETTINGS, MOCK_USER } from "./user";

/**
 * The active plan: six days from "Choose Whom You Will Serve", started
 * yesterday. Day 1 is done; day 2 is under way today (Read and Scripture
 * done, the first reflection answered). Its Quick Checks show a finished
 * quiz with one wrong answer, and one half-way through.
 */

const BUILT_AT = "2026-09-21T19:41:30.000Z";

export const PLAN_CHOOSE: Plan = {
  id: "plan-choose-whom-you-will-serve",
  createdAt: "2026-09-21T19:40:00.000Z",
  updatedAt: "2026-09-23T06:40:00.000Z",
  userId: MOCK_USER.id,
  sermonId: SERMON_CHOOSE.id,
  title: "Choose Whom You Will Serve",
  status: "active",
  lengthDays: 6,
  quickCheckEnabled: true,
  startDate: "2026-09-22",
  startedAt: "2026-09-22T06:34:00.000Z",
  completedAt: null,
  archivedAt: null,
  isSample: false,
};

const DAYS: MockDayInput[] = [
  {
    dayNumber: 1,
    title: "Choose today",
    status: "completed",
    paragraphs: [
      "Joshua gathers a nation that has watched God keep every promise, and asks them one thing: decide. Not someday. Today.",
      "Faith isn't only a feeling we wait for. It's a choice we make in ordinary mornings, again and again.",
    ],
    sermonQuote: "Joshua doesn't say 'choose someday.' He says choose this day. Today.",
    sermonClip: { startSeconds: 412, endSeconds: 530 },
    passage: {
      reference: "Joshua 24:15",
      book: "Joshua",
      chapter: 24,
      verses: [
        {
          number: 15,
          text: "But if serving the LORD seems undesirable to you, then choose for yourselves this day whom you will serve, whether the gods your ancestors served beyond the Euphrates, or the gods of the Amorites, in whose land you are living. But as for me and my household, we will serve the LORD.",
        },
      ],
    },
    reflections: [
      {
        question: "What have you been putting off deciding?",
        answer: "Whether I actually make room for God in the morning or just mean to.",
        answeredAt: "2026-09-22T06:44:00.000Z",
      },
    ],
    prayer: {
      text: "Lord, I don't want to drift into following You by accident. Today I choose You, on purpose. Amen.",
      prayedAt: "2026-09-22T06:51:00.000Z",
    },
    completedSteps: ALL_STEPS,
    scheduledOn: "2026-09-22",
    startedAt: "2026-09-22T06:34:00.000Z",
    completedAt: "2026-09-22T06:52:00.000Z",
  },
  {
    dayNumber: 2,
    title: "Grace is received",
    status: "inProgress",
    paragraphs: [
      "Most of us believe grace is free. We just don't live like it. We keep a quiet ledger: a good morning here, a kept promise there, as if God were checking the balance.",
      "Joshua's call to choose wasn't a call to earn. Israel was rescued long before they promised anything. Choosing God starts with receiving what He's already done.",
    ],
    sermonQuote: "Most of us believe grace is free. We just don't live like it.",
    sermonClip: { startSeconds: 1_122, endSeconds: 1_260 },
    passage: {
      reference: "Ephesians 2:8–9",
      book: "Ephesians",
      chapter: 2,
      verses: [
        {
          number: 8,
          text: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—",
        },
        { number: 9, text: "not by works, so that no one can boast." },
      ],
    },
    reflections: [
      {
        question: "What are you still trying to pay for?",
        answer:
          "Honestly, my mornings. If I skip time with God I feel like I owe Him extra the next day",
        answeredAt: "2026-09-23T06:40:00.000Z",
      },
      { question: "Where did you see grace this week?" },
    ],
    prayer: {
      text: "Father, I've been trying to pay for what You already gave. Help me stop keeping score. Today I choose You, not to earn Your love, but because I already have it. Amen.",
    },
    completedSteps: ["read", "scripture"],
    scheduledOn: "2026-09-23",
    startedAt: "2026-09-23T06:31:00.000Z",
    completedAt: null,
  },
  {
    dayNumber: 3,
    title: "One master",
    status: "locked",
    paragraphs: [
      "Every heart serves something. Jesus doesn't ask whether we'll serve, only who.",
      "Divided loyalty feels safe, but it quietly wears us out. Wholehearted is lighter than half-hearted.",
    ],
    sermonQuote: "You can't serve two masters. Something is going to get your yes.",
    sermonClip: { startSeconds: 1_686, endSeconds: 1_820 },
    passage: {
      reference: "Matthew 6:24",
      book: "Matthew",
      chapter: 6,
      verses: [
        {
          number: 24,
          text: "No one can serve two masters. Either you will hate the one and love the other, or you will be devoted to the one and despise the other. You cannot serve both God and money.",
        },
      ],
    },
    reflections: [{ question: "What is competing for your yes right now?" }],
    prayer: {
      text: "Jesus, You see what pulls at me. Gather my divided heart and make it wholly Yours. Amen.",
    },
    completedSteps: [],
    scheduledOn: "2026-09-24",
    startedAt: null,
    completedAt: null,
  },
  {
    dayNumber: 4,
    title: "Every day counts",
    status: "locked",
    paragraphs: [
      "Moses prayed to see his days clearly. Not to be afraid of time, but to spend it well.",
      "A heart of wisdom notices that today is a gift, and chooses what to do with it.",
    ],
    sermonQuote: "Make every day count. Not by earning it, but by choosing Him in it.",
    sermonClip: { startSeconds: 2_310, endSeconds: 2_420 },
    passage: {
      reference: "Psalm 90:12",
      book: "Psalm",
      chapter: 90,
      verses: [
        {
          number: 12,
          text: "Teach us to number our days, that we may gain a heart of wisdom.",
        },
      ],
    },
    reflections: [{ question: "What would change if you treated today as a gift?" }],
    prayer: {
      text: "Lord, teach me to see my days the way You see them, and to spend this one with You. Amen.",
    },
    completedSteps: [],
    scheduledOn: "2026-09-25",
    startedAt: null,
    completedAt: null,
  },
  {
    dayNumber: 5,
    title: "A living offering",
    status: "locked",
    paragraphs: [
      "Choosing God isn't a single moment at an altar. It's a life handed over, one ordinary day at a time.",
      "Paul calls it worship: not a song, but a whole self, offered in view of mercy.",
    ],
    sermonQuote: "Serving Him isn't a Sunday thing. It's a Tuesday-afternoon thing.",
    sermonClip: { startSeconds: 1_940, endSeconds: 2_050 },
    passage: {
      reference: "Romans 12:1",
      book: "Romans",
      chapter: 12,
      verses: [
        {
          number: 1,
          text: "Therefore, I urge you, brothers and sisters, in view of God's mercy, to offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship.",
        },
      ],
    },
    reflections: [{ question: "Where could an ordinary moment today become worship?" }],
    prayer: {
      text: "God, in view of Your mercy, I offer You my whole self again today. Use it. Amen.",
    },
    completedSteps: [],
    scheduledOn: "2026-09-26",
    startedAt: null,
    completedAt: null,
  },
  {
    dayNumber: 6,
    title: "We will serve",
    status: "locked",
    paragraphs: [
      "The people answered Joshua together: we will serve the LORD. A choice made out loud, in company.",
      "Faith grows stronger when it's shared. Who will you say it to?",
    ],
    sermonQuote: "Say it out loud. Choices get stronger when someone else hears them.",
    sermonClip: { startSeconds: 2_600, endSeconds: 2_720 },
    passage: {
      reference: "Joshua 24:24",
      book: "Joshua",
      chapter: 24,
      verses: [
        {
          number: 24,
          text: "And the people said to Joshua, “We will serve the LORD our God and obey him.”",
        },
      ],
    },
    reflections: [{ question: "Who could you share your choice with this week?" }],
    prayer: {
      text: "Lord, as for me and my household, we will serve You. Make it true in the small things. Amen.",
    },
    completedSteps: [],
    scheduledOn: "2026-09-27",
    startedAt: null,
    completedAt: null,
  },
];

const RECORDS = DAYS.map((input) =>
  makeDayRecords(PLAN_CHOOSE, BUILT_AT, MOCK_SETTINGS.bibleTranslation, input),
);

export const CHOOSE_DAYS = RECORDS.map((records) => records.day);
export const CHOOSE_SCRIPTURE = RECORDS.map((records) => records.scripture);
export const CHOOSE_REFLECTIONS = RECORDS.flatMap((records) => records.reflections);
export const CHOOSE_PRAYERS = RECORDS.map((records) => records.prayer);

const [DAY_1, DAY_2] = CHOOSE_DAYS;

// ---------------------------------------------------------------------------
// Quick Checks
// ---------------------------------------------------------------------------

const QUIZ_DAY_1: Quiz = {
  id: `${PLAN_CHOOSE.id}-day-1-quiz`,
  createdAt: BUILT_AT,
  updatedAt: BUILT_AT,
  planId: PLAN_CHOOSE.id,
  planDayId: DAY_1?.id ?? null,
  title: "Day 1 quick check",
};

const QUIZ_DAY_2: Quiz = {
  id: `${PLAN_CHOOSE.id}-day-2-quiz`,
  createdAt: BUILT_AT,
  updatedAt: BUILT_AT,
  planId: PLAN_CHOOSE.id,
  planDayId: DAY_2?.id ?? null,
  title: "Day 2 quick check",
};

const Q1_1 = `${QUIZ_DAY_1.id}-q1`;
const Q1_2 = `${QUIZ_DAY_1.id}-q2`;
const Q2_1 = `${QUIZ_DAY_2.id}-q1`;
const Q2_2 = `${QUIZ_DAY_2.id}-q2`;
const Q2_3 = `${QUIZ_DAY_2.id}-q3`;

const QUESTIONS: QuizQuestion[] = [
  {
    id: Q1_1,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ_DAY_1.id,
    order: 1,
    kind: "multipleChoice",
    source: "sermon",
    prompt: "In Joshua 24, what does Joshua ask the people to do?",
    choices: makeChoices(Q1_1, [
      "Build an altar at Shechem",
      "Choose this day whom they will serve",
      "Return to the land of Egypt",
      "Rebuild the walls of Jericho",
    ]),
    correctChoiceId: `${Q1_1}-b`,
    explanation:
      "Joshua calls Israel to decide, today, whom they will serve — and says his household will serve the LORD.",
    scriptureReference: "Joshua 24:15",
  },
  {
    id: Q1_2,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ_DAY_1.id,
    order: 2,
    kind: "multipleChoice",
    source: "sermon",
    prompt: "When does the sermon say the choice to serve God happens?",
    choices: makeChoices(Q1_2, [
      "Once, when you first believe",
      "Today, and again each day",
      "When life finally slows down",
      "Only on Sundays",
    ]),
    correctChoiceId: `${Q1_2}-b`,
    explanation:
      "\"Choose this day\" — the sermon's point is that it's a daily choice, not a one-time one.",
    scriptureReference: null,
  },
  {
    id: Q2_1,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ_DAY_2.id,
    order: 1,
    kind: "multipleChoice",
    source: "scripture",
    prompt: "According to Ephesians 2:8–9, how are we saved?",
    choices: makeChoices(Q2_1, [
      "By keeping the law",
      "By grace, through faith",
      "By our good works",
      "By our family's faith",
    ]),
    correctChoiceId: `${Q2_1}-b`,
    explanation: "Paul is clear: by grace, through faith — a gift, not something earned.",
    scriptureReference: "Ephesians 2:8",
  },
  {
    id: Q2_2,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ_DAY_2.id,
    order: 2,
    kind: "finishTheVerse",
    source: "scripture",
    prompt: "Finish the verse: “…and this is not from yourselves, it is the ___.”",
    choices: makeChoices(Q2_2, [
      "reward of the faithful",
      "gift of God",
      "fruit of the law",
      "promise to Abraham",
    ]),
    correctChoiceId: `${Q2_2}-b`,
    explanation: "Salvation is the gift of God — which is why no one can boast.",
    scriptureReference: "Ephesians 2:8",
  },
  {
    id: Q2_3,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ_DAY_2.id,
    order: 3,
    kind: "multipleChoice",
    source: "sermon",
    prompt: "What does the sermon say many of us keep, even though grace is free?",
    choices: makeChoices(Q2_3, [
      "A prayer journal",
      "A quiet ledger",
      "A list of questions",
      "A Sabbath rest",
    ]),
    correctChoiceId: `${Q2_3}-b`,
    explanation: "A quiet ledger — as if God were checking the balance every morning.",
    scriptureReference: null,
  },
];

/** Day 1's: finished, one right and one wrong. */
const ATTEMPT_DAY_1: QuizAttempt = {
  id: `${QUIZ_DAY_1.id}-attempt-1`,
  createdAt: "2026-09-22T19:05:00.000Z",
  updatedAt: "2026-09-22T19:07:00.000Z",
  quizId: QUIZ_DAY_1.id,
  status: "completed",
  currentQuestionId: null,
  selectedChoiceId: null,
  startedAt: "2026-09-22T19:05:00.000Z",
  completedAt: "2026-09-22T19:07:00.000Z",
};

/**
 * Day 2's: under way — the first question answered right, and the second on
 * screen with a choice picked but not yet submitted.
 */
const ATTEMPT_DAY_2: QuizAttempt = {
  id: `${QUIZ_DAY_2.id}-attempt-1`,
  createdAt: "2026-09-23T06:58:00.000Z",
  updatedAt: "2026-09-23T06:59:00.000Z",
  quizId: QUIZ_DAY_2.id,
  status: "inProgress",
  currentQuestionId: Q2_2,
  selectedChoiceId: `${Q2_2}-a`,
  startedAt: "2026-09-23T06:58:00.000Z",
  completedAt: null,
};

const ANSWERS: QuizAnswer[] = [
  {
    id: `${ATTEMPT_DAY_1.id}-q1`,
    createdAt: "2026-09-22T19:06:00.000Z",
    updatedAt: "2026-09-22T19:06:00.000Z",
    attemptId: ATTEMPT_DAY_1.id,
    questionId: Q1_1,
    choiceId: `${Q1_1}-b`,
    answeredAt: "2026-09-22T19:06:00.000Z",
  },
  {
    id: `${ATTEMPT_DAY_1.id}-q2`,
    createdAt: "2026-09-22T19:07:00.000Z",
    updatedAt: "2026-09-22T19:07:00.000Z",
    attemptId: ATTEMPT_DAY_1.id,
    questionId: Q1_2,
    choiceId: `${Q1_2}-a`,
    answeredAt: "2026-09-22T19:07:00.000Z",
  },
  {
    id: `${ATTEMPT_DAY_2.id}-q1`,
    createdAt: "2026-09-23T06:59:00.000Z",
    updatedAt: "2026-09-23T06:59:00.000Z",
    attemptId: ATTEMPT_DAY_2.id,
    questionId: Q2_1,
    choiceId: `${Q2_1}-b`,
    answeredAt: "2026-09-23T06:59:00.000Z",
  },
];

export const CHOOSE_QUIZZES: Quiz[] = [QUIZ_DAY_1, QUIZ_DAY_2];
export const CHOOSE_QUIZ_QUESTIONS = QUESTIONS;
export const CHOOSE_QUIZ_ATTEMPTS: QuizAttempt[] = [ATTEMPT_DAY_1, ATTEMPT_DAY_2];
export const CHOOSE_QUIZ_ANSWERS = ANSWERS;
