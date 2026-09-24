import type { QuizQuestionKind, QuizQuestionSource, ScriptureVerse } from "@/types/domain";

/** One question of a day's Quick Check, as written; the builder shuffles its choices' order. */
type QuestionTemplate = {
  kind: QuizQuestionKind;
  source: QuizQuestionSource;
  prompt: string;
  choices: readonly string[];
  correctIndex: number;
  explanation: string;
  scriptureReference: string | null;
};

/** One day of a built plan, before it's tied to a plan: its reading, Scripture, and practice. */
export type DayTemplate = {
  title: string;
  paragraphs: readonly string[];
  sermonQuote: string;
  passage: { reference: string; book: string; chapter: number; verses: readonly ScriptureVerse[] };
  reflection: string;
  prayer: string;
  questions: readonly QuestionTemplate[];
};

/**
 * The days a mock-built plan draws on, in order — a plan of N days takes the
 * first N. General enough to follow any sermon; the real builder writes them
 * from the sermon itself.
 */
export const DAY_TEMPLATES: readonly DayTemplate[] = [
  {
    title: "Start with listening",
    paragraphs: [
      "Sunday's message wasn't meant to stay in the room. This week is about carrying it into ordinary days.",
      "James is blunt: hearing isn't the finish line. Doing is where the word takes root.",
    ],
    sermonQuote: "Don't just take notes on Sunday. Take one step on Monday.",
    passage: {
      reference: "James 1:22",
      book: "James",
      chapter: 1,
      verses: [
        {
          number: 22,
          text: "Do not merely listen to the word, and so deceive yourselves. Do what it says.",
        },
      ],
    },
    reflection: "What's one thing from Sunday you could actually do this week?",
    prayer: "Lord, don't let Your word stop at my ears. Show me one way to live it today. Amen.",
    questions: [
      {
        kind: "multipleChoice",
        source: "scripture",
        prompt: "According to James 1:22, what does merely listening do?",
        choices: ["Makes us wise", "Deceives ourselves", "Pleases God", "Fulfils the law"],
        correctIndex: 1,
        explanation: "James warns that listening without doing is self-deception.",
        scriptureReference: "James 1:22",
      },
      {
        kind: "finishTheVerse",
        source: "scripture",
        prompt: "Finish the verse: “Do not merely listen to the word… ___.”",
        choices: ["Study it daily", "Do what it says", "Teach it to others", "Write it down"],
        correctIndex: 1,
        explanation: "“Do what it says” — the word is meant to be lived.",
        scriptureReference: "James 1:22",
      },
    ],
  },
  {
    title: "A lamp for today",
    paragraphs: [
      "A lamp doesn't light the whole road. It lights the next step — which is usually all we need.",
      "God's word is less a map of the whole journey than light for today's part of it.",
    ],
    sermonQuote: "You don't need to see the whole staircase. Just the next step.",
    passage: {
      reference: "Psalm 119:105",
      book: "Psalm",
      chapter: 119,
      verses: [{ number: 105, text: "Your word is a lamp for my feet, a light on my path." }],
    },
    reflection: "What's the next step you need light for?",
    prayer: "God, light my next step. I trust You with the rest of the road. Amen.",
    questions: [
      {
        kind: "multipleChoice",
        source: "scripture",
        prompt: "In Psalm 119:105, what is God's word to our feet?",
        choices: ["A shield", "A lamp", "A rock", "A river"],
        correctIndex: 1,
        explanation: "“Your word is a lamp for my feet, a light on my path.”",
        scriptureReference: "Psalm 119:105",
      },
      {
        kind: "multipleChoice",
        source: "sermon",
        prompt: "What does a lamp light, in this reading?",
        choices: ["The whole road ahead", "The next step", "The way back", "Nothing at all"],
        correctIndex: 1,
        explanation: "A lamp lights the next step — enough for today.",
        scriptureReference: null,
      },
    ],
  },
  {
    title: "Rooted",
    paragraphs: [
      "Faith isn't a moment we had once. Paul pictures it as roots — growing deeper, holding firm.",
      "Roots grow unseen, in ordinary seasons. Today's quiet faithfulness is part of it.",
    ],
    sermonQuote: "Deep roots are grown on days nobody sees.",
    passage: {
      reference: "Colossians 2:6–7",
      book: "Colossians",
      chapter: 2,
      verses: [
        {
          number: 6,
          text: "So then, just as you received Christ Jesus as Lord, continue to live your lives in him,",
        },
        {
          number: 7,
          text: "rooted and built up in him, strengthened in the faith as you were taught, and overflowing with thankfulness.",
        },
      ],
    },
    reflection: "What helps your faith grow deeper roots?",
    prayer: "Jesus, root me deeper in You — on the ordinary days most of all. Amen.",
    questions: [
      {
        kind: "multipleChoice",
        source: "scripture",
        prompt: "In Colossians 2:7, what should we be overflowing with?",
        choices: ["Knowledge", "Thankfulness", "Strength", "Words"],
        correctIndex: 1,
        explanation: "Rooted and built up in Him, “overflowing with thankfulness.”",
        scriptureReference: "Colossians 2:7",
      },
      {
        kind: "multipleChoice",
        source: "sermon",
        prompt: "When, the reading says, do roots grow?",
        choices: [
          "Only on Sundays",
          "In ordinary, unseen seasons",
          "Only in hard times",
          "Overnight",
        ],
        correctIndex: 1,
        explanation: "Roots grow unseen, in ordinary seasons.",
        scriptureReference: null,
      },
    ],
  },
  {
    title: "Strength for the weary",
    paragraphs: [
      "Isaiah writes to people worn out by waiting. His answer isn't try harder — it's hope in the LORD.",
      "Renewed strength comes from Someone outside us, not a reserve we have to find.",
    ],
    sermonQuote: "God doesn't just top you up. He renews you.",
    passage: {
      reference: "Isaiah 40:31",
      book: "Isaiah",
      chapter: 40,
      verses: [
        {
          number: 31,
          text: "but those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
        },
      ],
    },
    reflection: "Where are you running on empty right now?",
    prayer: "LORD, I'm tired. I put my hope in You. Renew my strength for today. Amen.",
    questions: [
      {
        kind: "finishTheVerse",
        source: "scripture",
        prompt: "Finish the verse: “They will soar on wings like ___.”",
        choices: ["doves", "eagles", "angels", "the wind"],
        correctIndex: 1,
        explanation: "“They will soar on wings like eagles” — Isaiah 40:31.",
        scriptureReference: "Isaiah 40:31",
      },
      {
        kind: "multipleChoice",
        source: "scripture",
        prompt: "Who renew their strength, according to Isaiah 40:31?",
        choices: [
          "Those who rest more",
          "Those who hope in the LORD",
          "Those who never give up",
          "Those who are young",
        ],
        correctIndex: 1,
        explanation: "Strength is renewed for “those who hope in the LORD.”",
        scriptureReference: "Isaiah 40:31",
      },
    ],
  },
  {
    title: "Love in action",
    paragraphs: [
      "John won't let love stay a feeling. Real love shows up — in actions, and in truth.",
      "Love that costs nothing usually changes nothing. Who could you show it to today?",
    ],
    sermonQuote: "Love is a verb before it's a feeling.",
    passage: {
      reference: "1 John 3:18",
      book: "1 John",
      chapter: 3,
      verses: [
        {
          number: 18,
          text: "Dear children, let us not love with words or speech but with actions and in truth.",
        },
      ],
    },
    reflection: "Who could you love with an action today, not just words?",
    prayer: "Father, make my love real — not just words, but something someone can feel. Amen.",
    questions: [
      {
        kind: "multipleChoice",
        source: "scripture",
        prompt: "In 1 John 3:18, how should we love?",
        choices: [
          "With words and speech",
          "With actions and in truth",
          "Only those who love us",
          "When it's convenient",
        ],
        correctIndex: 1,
        explanation: "“Not with words or speech but with actions and in truth.”",
        scriptureReference: "1 John 3:18",
      },
      {
        kind: "multipleChoice",
        source: "sermon",
        prompt: "The reading calls love a ___ before it's a feeling.",
        choices: ["rule", "verb", "reward", "habit"],
        correctIndex: 1,
        explanation: "Love is something we do.",
        scriptureReference: null,
      },
    ],
  },
  {
    title: "Trust the path",
    paragraphs: [
      "Trusting God with all our heart means not leaning on our own understanding — even when it seems clearer.",
      "The promise isn't an easy path, but a straight one, walked with Him.",
    ],
    sermonQuote: "Trust isn't knowing the plan. It's knowing the One who does.",
    passage: {
      reference: "Proverbs 3:5–6",
      book: "Proverbs",
      chapter: 3,
      verses: [
        {
          number: 5,
          text: "Trust in the LORD with all your heart and lean not on your own understanding;",
        },
        {
          number: 6,
          text: "in all your ways submit to him, and he will make your paths straight.",
        },
      ],
    },
    reflection: "Where are you leaning on your own understanding?",
    prayer: "LORD, I trust You with all my heart — including the parts I can't figure out. Amen.",
    questions: [
      {
        kind: "finishTheVerse",
        source: "scripture",
        prompt: "Finish the verse: “…and he will make your ___ straight.”",
        choices: ["plans", "paths", "thoughts", "choices"],
        correctIndex: 1,
        explanation: "“He will make your paths straight” — Proverbs 3:6.",
        scriptureReference: "Proverbs 3:6",
      },
      {
        kind: "multipleChoice",
        source: "scripture",
        prompt: "What does Proverbs 3:5 tell us not to lean on?",
        choices: ["Other people", "Our own understanding", "Our feelings", "Our past"],
        correctIndex: 1,
        explanation: "“Lean not on your own understanding.”",
        scriptureReference: "Proverbs 3:5",
      },
    ],
  },
  {
    title: "Keep going",
    paragraphs: [
      "A week of small faithfulness might not look like much. Paul says the harvest comes at the proper time.",
      "Don't measure this week by how it felt. Keep going — the seeds are in the ground.",
    ],
    sermonQuote: "Faithfulness is mostly just not giving up.",
    passage: {
      reference: "Galatians 6:9",
      book: "Galatians",
      chapter: 6,
      verses: [
        {
          number: 9,
          text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
        },
      ],
    },
    reflection: "What good thing do you want to keep going with after this plan?",
    prayer: "God, keep me faithful in the small things. I trust You with the harvest. Amen.",
    questions: [
      {
        kind: "multipleChoice",
        source: "scripture",
        prompt: "According to Galatians 6:9, when will we reap a harvest?",
        choices: ["Right away", "At the proper time", "Only in heaven", "When we deserve it"],
        correctIndex: 1,
        explanation: "“At the proper time we will reap a harvest if we do not give up.”",
        scriptureReference: "Galatians 6:9",
      },
      {
        kind: "finishTheVerse",
        source: "scripture",
        prompt: "Finish the verse: “Let us not become weary in ___.”",
        choices: ["praying", "doing good", "waiting", "serving"],
        correctIndex: 1,
        explanation: "“Let us not become weary in doing good.”",
        scriptureReference: "Galatians 6:9",
      },
    ],
  },
];
