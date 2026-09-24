import type { Plan, Quiz, QuizAnswer, QuizAttempt, QuizQuestion } from "@/types/domain";

import { ALL_STEPS, makeDayRecords, type MockDayInput } from "./plan-day-records";
import { makeChoices } from "./quiz-choices";
import { SERMON_GRATITUDE } from "./sermons";
import { MOCK_SETTINGS, MOCK_USER } from "./user";

/**
 * The completed plan: seven days from "Give Thanks in All Things", one each
 * morning from 30 August to 5 September, every reflection answered and every
 * prayer prayed, then a Quick Check finished with a perfect score.
 */

const BUILT_AT = "2026-08-29T20:16:10.000Z";

export const PLAN_GRATITUDE: Plan = {
  id: "plan-give-thanks",
  createdAt: "2026-08-29T20:15:00.000Z",
  updatedAt: "2026-09-05T07:05:00.000Z",
  userId: MOCK_USER.id,
  sermonId: SERMON_GRATITUDE.id,
  title: "Give Thanks in All Things",
  status: "completed",
  lengthDays: 7,
  quickCheckEnabled: true,
  startDate: "2026-08-30",
  startedAt: "2026-08-30T06:36:00.000Z",
  completedAt: "2026-09-05T07:05:00.000Z",
  archivedAt: null,
};

/** A finished day's timing: started, answered, prayed, and done that morning. */
function finishedOn(date: string, minute: number) {
  const at = (offset: number) => `${date}T06:${String(minute + offset).padStart(2, "0")}:00.000Z`;
  return {
    status: "completed" as const,
    completedSteps: ALL_STEPS,
    scheduledOn: date,
    startedAt: at(0),
    answeredAt: at(9),
    prayedAt: at(15),
    completedAt: at(16),
  };
}

type Written = Omit<
  MockDayInput,
  | "status"
  | "completedSteps"
  | "scheduledOn"
  | "startedAt"
  | "completedAt"
  | "reflections"
  | "prayer"
> & { question: string; answer: string; prayer: string; on: string; minute: number };

const WRITTEN: Written[] = [
  {
    dayNumber: 1,
    title: "Always, in all things",
    on: "2026-08-30",
    minute: 32,
    paragraphs: [
      "Paul doesn't say give thanks for everything that happens. He says give thanks in it — in every circumstance.",
      "Gratitude isn't pretending things are fine. It's remembering God is present in them.",
    ],
    sermonQuote: "Paul says give thanks in all circumstances, not for all of them.",
    sermonClip: { startSeconds: 288, endSeconds: 402 },
    passage: {
      reference: "1 Thessalonians 5:16–18",
      book: "1 Thessalonians",
      chapter: 5,
      verses: [
        { number: 16, text: "Rejoice always," },
        { number: 17, text: "pray continually," },
        {
          number: 18,
          text: "give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
        },
      ],
    },
    question: "What's one hard thing you can give thanks in, not for?",
    answer: "The job search. Not for the waiting, but that I'm not waiting alone.",
    prayer: "Lord, teach me to thank You in the middle of things, not just after them. Amen.",
  },
  {
    dayNumber: 2,
    title: "Enter with thanks",
    on: "2026-08-31",
    minute: 30,
    paragraphs: [
      "The psalm's way into God's presence starts at the gate, with thanks.",
      "Thanksgiving turns our attention from what we lack to who He is.",
    ],
    sermonQuote: "Thanksgiving is the front door. You don't sneak into worship through the side.",
    sermonClip: { startSeconds: 540, endSeconds: 640 },
    passage: {
      reference: "Psalm 100:4",
      book: "Psalm",
      chapter: 100,
      verses: [
        {
          number: 4,
          text: "Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.",
        },
      ],
    },
    question: "How could you start your prayers with thanks this week?",
    answer: "Name three things before I ask for anything.",
    prayer: "God, I come in with thanks today. You are good, and You have been good to me. Amen.",
  },
  {
    dayNumber: 3,
    title: "Thanks instead of worry",
    on: "2026-09-01",
    minute: 34,
    paragraphs: [
      "Paul pairs every request with thanksgiving. Worry and gratitude find it hard to share a room.",
      "The promise isn't that every problem disappears, but that peace will guard us in it.",
    ],
    sermonQuote: "Gratitude is not a feeling you wait for. It's a practice you choose.",
    sermonClip: { startSeconds: 905, endSeconds: 1_020 },
    passage: {
      reference: "Philippians 4:6–7",
      book: "Philippians",
      chapter: 4,
      verses: [
        {
          number: 6,
          text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
        },
        {
          number: 7,
          text: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
        },
      ],
    },
    question: "What worry could you bring to God with thanks today?",
    answer: "My mom's health. Thankful for her doctors, and handing Him the rest.",
    prayer:
      "Father, here's what I'm anxious about. Thank You that You hear me. Guard my heart with Your peace. Amen.",
  },
  {
    dayNumber: 4,
    title: "He is good",
    on: "2026-09-02",
    minute: 31,
    paragraphs: [
      "The simplest reason to give thanks is the most solid one: God is good, and His love doesn't run out.",
      "Our circumstances change. His character doesn't.",
    ],
    sermonQuote: "Start with who He is. That never needs updating.",
    sermonClip: { startSeconds: 1_110, endSeconds: 1_190 },
    passage: {
      reference: "Psalm 107:1",
      book: "Psalm",
      chapter: 107,
      verses: [
        {
          number: 1,
          text: "Give thanks to the LORD, for he is good; his love endures forever.",
        },
      ],
    },
    question: "Where have you seen God's goodness this month?",
    answer: "A friend showed up with dinner the week everything fell apart.",
    prayer:
      "Lord, You are good, and Your love lasts. Thank You for showing me that this week. Amen.",
  },
  {
    dayNumber: 5,
    title: "New every morning",
    on: "2026-09-03",
    minute: 33,
    paragraphs: [
      "Lamentations is written from the rubble, yet it finds mercy that's new each morning.",
      "Yesterday's failures don't use up today's compassion.",
    ],
    sermonQuote: "His mercy doesn't carry over a balance. It's new every morning.",
    sermonClip: { startSeconds: 1_260, endSeconds: 1_350 },
    passage: {
      reference: "Lamentations 3:22–23",
      book: "Lamentations",
      chapter: 3,
      verses: [
        {
          number: 22,
          text: "Because of the LORD's great love we are not consumed, for his compassions never fail.",
        },
        { number: 23, text: "They are new every morning; great is your faithfulness." },
      ],
    },
    question: "What do you need God's new mercy for this morning?",
    answer: "How short I was with my brother yesterday.",
    prayer: "God, thank You that Your mercy is new today. Help me start fresh with You. Amen.",
  },
  {
    dayNumber: 6,
    title: "Every good gift",
    on: "2026-09-04",
    minute: 35,
    paragraphs: [
      "James traces every good thing back to its source. Nothing good is an accident.",
      "Gratitude connects the gift to the Giver.",
    ],
    sermonQuote: "Every good thing in your life has a return address.",
    sermonClip: { startSeconds: 1_420, endSeconds: 1_500 },
    passage: {
      reference: "James 1:17",
      book: "James",
      chapter: 1,
      verses: [
        {
          number: 17,
          text: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
        },
      ],
    },
    question: "What good gift have you been treating as ordinary?",
    answer: "Slow Saturday mornings with coffee and quiet.",
    prayer: "Father of lights, every good thing I have came from You. Thank You. Amen.",
  },
  {
    dayNumber: 7,
    title: "The one who came back",
    on: "2026-09-05",
    minute: 30,
    paragraphs: [
      "Ten men were healed. One came back to say thank you — and Jesus noticed.",
      "Gratitude is turning around to find the One who helped us.",
    ],
    sermonQuote: "Ten were healed, and one came back. That's the one I want to be.",
    sermonClip: { startSeconds: 1_530, endSeconds: 1_640 },
    passage: {
      reference: "Luke 17:15–16",
      book: "Luke",
      chapter: 17,
      verses: [
        {
          number: 15,
          text: "One of them, when he saw he was healed, came back, praising God in a loud voice.",
        },
        {
          number: 16,
          text: "He threw himself at Jesus' feet and thanked him—and he was a Samaritan.",
        },
      ],
    },
    question: "Who do you need to go back and thank?",
    answer: "My youth pastor from years ago. I'm going to write to him.",
    prayer: "Jesus, I don't want to take Your kindness and keep walking. Thank You. Amen.",
  },
];

const RECORDS = WRITTEN.map(({ question, answer, prayer, on, minute, ...content }) => {
  const { answeredAt, prayedAt, ...timing } = finishedOn(on, minute);
  return makeDayRecords(PLAN_GRATITUDE, BUILT_AT, MOCK_SETTINGS.bibleTranslation, {
    ...content,
    ...timing,
    reflections: [{ question, answer, answeredAt }],
    prayer: { text: prayer, prayedAt },
  });
});

export const GRATITUDE_DAYS = RECORDS.map((records) => records.day);
export const GRATITUDE_SCRIPTURE = RECORDS.map((records) => records.scripture);
export const GRATITUDE_REFLECTIONS = RECORDS.flatMap((records) => records.reflections);
export const GRATITUDE_PRAYERS = RECORDS.map((records) => records.prayer);

// ---------------------------------------------------------------------------
// Quick Check — after the last day, finished with every answer right
// ---------------------------------------------------------------------------

const QUIZ: Quiz = {
  id: `${PLAN_GRATITUDE.id}-quiz`,
  createdAt: BUILT_AT,
  updatedAt: BUILT_AT,
  planId: PLAN_GRATITUDE.id,
  planDayId: GRATITUDE_DAYS.at(-1)?.id ?? null,
  title: "Give Thanks quick check",
};

const Q1 = `${QUIZ.id}-q1`;
const Q2 = `${QUIZ.id}-q2`;
const Q3 = `${QUIZ.id}-q3`;

const QUESTIONS: QuizQuestion[] = [
  {
    id: Q1,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ.id,
    order: 1,
    kind: "multipleChoice",
    source: "scripture",
    prompt: "In 1 Thessalonians 5:18, when does Paul say to give thanks?",
    choices: makeChoices(Q1, [
      "Only when things go well",
      "In all circumstances",
      "Once a week, together",
      "After a prayer is answered",
    ]),
    correctChoiceId: `${Q1}-b`,
    explanation: "In all circumstances — thanks in the situation, not necessarily for it.",
    scriptureReference: "1 Thessalonians 5:18",
  },
  {
    id: Q2,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ.id,
    order: 2,
    kind: "multipleChoice",
    source: "scripture",
    prompt: "How many of the ten healed men came back to thank Jesus?",
    choices: makeChoices(Q2, ["None", "One", "Five", "All ten"]),
    correctChoiceId: `${Q2}-b`,
    explanation: "Only one came back — a Samaritan — and Jesus noticed.",
    scriptureReference: "Luke 17:15–16",
  },
  {
    id: Q3,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    quizId: QUIZ.id,
    order: 3,
    kind: "finishTheVerse",
    source: "scripture",
    prompt: "Finish the verse: “They are new every morning; great is your ___.”",
    choices: makeChoices(Q3, ["mercy", "faithfulness", "kindness", "patience"]),
    correctChoiceId: `${Q3}-b`,
    explanation: "“Great is your faithfulness” — Lamentations 3:23.",
    scriptureReference: "Lamentations 3:23",
  },
];

const ATTEMPT: QuizAttempt = {
  id: `${QUIZ.id}-attempt-1`,
  createdAt: "2026-09-05T07:06:00.000Z",
  updatedAt: "2026-09-05T07:09:00.000Z",
  quizId: QUIZ.id,
  status: "completed",
  startedAt: "2026-09-05T07:06:00.000Z",
  completedAt: "2026-09-05T07:09:00.000Z",
};

const ANSWERS: QuizAnswer[] = QUESTIONS.map((question, index) => {
  const answeredAt = `2026-09-05T07:0${7 + Math.min(index, 2)}:00.000Z`;
  return {
    id: `${ATTEMPT.id}-q${index + 1}`,
    createdAt: answeredAt,
    updatedAt: answeredAt,
    attemptId: ATTEMPT.id,
    questionId: question.id,
    choiceId: question.correctChoiceId,
    answeredAt,
  };
});

export const GRATITUDE_QUIZZES: Quiz[] = [QUIZ];
export const GRATITUDE_QUIZ_QUESTIONS = QUESTIONS;
export const GRATITUDE_QUIZ_ATTEMPTS: QuizAttempt[] = [ATTEMPT];
export const GRATITUDE_QUIZ_ANSWERS = ANSWERS;
