import type { ScripturePassage, ScriptureVerse } from "@/types/domain";

import { CHOOSE_SCRIPTURE } from "./plan-choose";
import { SAMPLE_SCRIPTURE } from "./plan-sample";

/**
 * The King James text (public domain) of the active plan's and the sample
 * plan's passages, verse by verse, keyed by reference. The plans are built in
 * the user's translation at the time (NIV); these are the same passages in
 * another, so choosing KJV in Settings changes what Scripture shows.
 */
const KJV: Readonly<Record<string, ScriptureVerse[]>> = {
  "Joshua 24:15": [
    {
      number: 15,
      text: "And if it seem evil unto you to serve the LORD, choose you this day whom ye will serve; whether the gods which your fathers served that were on the other side of the flood, or the gods of the Amorites, in whose land ye dwell: but as for me and my house, we will serve the LORD.",
    },
  ],
  "Ephesians 2:8–9": [
    {
      number: 8,
      text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:",
    },
    { number: 9, text: "Not of works, lest any man should boast." },
  ],
  "Matthew 6:24": [
    {
      number: 24,
      text: "No man can serve two masters: for either he will hate the one, and love the other; or else he will hold to the one, and despise the other. Ye cannot serve God and mammon.",
    },
  ],
  "Psalm 90:12": [
    {
      number: 12,
      text: "So teach us to number our days, that we may apply our hearts unto wisdom.",
    },
  ],
  "Romans 12:1": [
    {
      number: 1,
      text: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.",
    },
  ],
  "Joshua 24:24": [
    {
      number: 24,
      text: "And the people said unto Joshua, The LORD our God will we serve, and his voice will we obey.",
    },
  ],
  "Deuteronomy 31:6": [
    {
      number: 6,
      text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.",
    },
  ],
  "Hebrews 13:5": [
    {
      number: 5,
      text: "Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.",
    },
  ],
  "Psalm 23:4": [
    {
      number: 4,
      text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
    },
  ],
  "Matthew 28:20": [
    {
      number: 20,
      text: "Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.",
    },
  ],
  "Romans 8:38–39": [
    {
      number: 38,
      text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
    },
    {
      number: 39,
      text: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
    },
  ],
};

/**
 * Every passage above, as its own record beside the one the plan was built
 * with: same reference and verses, `-kjv` on the ID.
 */
export const SCRIPTURE_VARIANTS: ScripturePassage[] = [
  ...CHOOSE_SCRIPTURE,
  ...SAMPLE_SCRIPTURE,
].flatMap((passage) => {
  const verses = KJV[passage.reference];
  return verses
    ? [{ ...passage, id: `${passage.id}-kjv`, translation: "KJV" as const, verses }]
    : [];
});
