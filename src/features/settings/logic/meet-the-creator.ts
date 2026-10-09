/** One piece of the letter: a paragraph, its one featured line, or a short list. */
export type CreatorBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: readonly string[] };

/** A part of the letter: a plain heading — the opening has none — then what it says. */
type CreatorSection = { heading?: string; blocks: readonly CreatorBlock[] };

/** One fact about him, at a glance: where he is, how long he's built software, and for whom. */
type CreatorFact = { icon: "place" | "experience" | "clients"; text: string };

type MeetTheCreator = {
  /** Who he is, under his photo. */
  identity: { name: string; role: string };
  facts: readonly CreatorFact[];
  /** What the letter's called, over its first line. */
  letter: string;
  /** The letter's first line, set large. */
  standfirst: string;
  sections: readonly CreatorSection[];
  signOff: { name: string; role: string; motto: string };
};

/**
 * Meet the creator's words: a short letter from Walter, in his own voice —
 * why SundayBest exists, who's behind it, and what it will and won't do.
 */
export const MEET_THE_CREATOR: MeetTheCreator = {
  identity: {
    name: "Walter Whitaker",
    role: "Creator, Engineer & Designer",
  },
  facts: [
    { icon: "place", text: "Dallas, TX" },
    { icon: "experience", text: "10+ years designing and engineering software" },
    {
      icon: "clients",
      text: "Built for Apple, the NBA, General Motors, Magna, The Home Depot, and Kroger",
    },
  ],
  letter: "A note from Walter",
  standfirst: "I wanted to build something worth paying attention to.",
  sections: [
    {
      blocks: [
        {
          kind: "paragraph",
          text: "I'm Walter. I designed and engineered SundayBest because I kept coming back to one simple thought:",
        },
        { kind: "quote", text: "What we hear on Sunday should have a life beyond Sunday." },
        {
          kind: "paragraph",
          text: "A sermon can challenge you, expose something in you, or teach you something you've never understood. A few days later, most of it can already feel distant.",
        },
        {
          kind: "paragraph",
          text: "I wanted something that helps us stay with it. Not to consume more, but to go deeper.",
        },
      ],
    },
    {
      heading: "Before SundayBest",
      blocks: [
        {
          kind: "paragraph",
          text: "A decade of building software taught me how much thought hides behind something that feels simple. The technology here is different. The standard isn't.",
        },
      ],
    },
    {
      heading: "The faith behind it",
      blocks: [
        {
          kind: "paragraph",
          text: "I'm not a pastor or a theologian. I'm a Christian trying to take following Jesus seriously, through seasons of discipline, repentance, rebuilding, and sobriety.",
        },
        {
          kind: "paragraph",
          text: "SundayBest came out of that faith, not the market. I wanted something to help move what I hear from attention to understanding, and from understanding to obedience.",
        },
        { kind: "paragraph", text: "Not perfection. Seriousness." },
      ],
    },
    {
      heading: "The small decisions",
      blocks: [
        {
          kind: "paragraph",
          text: "I built the kind of tool I wanted to use, so I care about the small decisions:",
        },
        {
          kind: "list",
          items: [
            "How long a study should take.",
            "When a question is actually worth asking.",
            "How Scripture is presented.",
            "How a sermon is divided into days.",
            "What the technology may add, and what it never should.",
          ],
        },
        { kind: "paragraph", text: "Those details are the product." },
      ],
    },
    {
      heading: "Knowing its place",
      blocks: [
        {
          kind: "paragraph",
          text: "SundayBest isn't Scripture. It isn't your pastor or your church. And it shouldn't do your thinking for you.",
        },
        {
          kind: "paragraph",
          text: "It should make room for deeper study, honest reflection, and a return to the Word itself.",
        },
      ],
    },
    {
      heading: "Still building",
      blocks: [
        {
          kind: "paragraph",
          text: "SundayBest isn't finished, and I don't want it to be. I'll keep listening, learning, and refining it, so it's worthy of the time you spend here.",
        },
        {
          kind: "paragraph",
          text: "Your attention is valuable. The reason you opened SundayBest is even more so.",
        },
      ],
    },
  ],
  signOff: {
    name: "Walter",
    role: "Creator, Engineer & Designer",
    motto: "Built with conviction. For a life of conviction.",
  },
};
