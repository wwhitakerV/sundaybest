import { splitReadingSections } from "@/features/plans/logic/reading-sections";

const read = [
  { heading: "Hope Is Not Denial", content: "Real pain is named." },
  { heading: "When Answers Don't Come", content: "Waiting is not abandonment." },
];

describe("splitReadingSections", () => {
  it("puts the paragraphs headed by the day's passage, and those after, under Scripture study", () => {
    const study = [
      { heading: "Psalm 42:3–5", content: "In verse 5, David speaks to his own soul." },
      { heading: "A Second Look", content: "Notice the repeated question." },
    ];

    expect(splitReadingSections([...read, ...study], "Psalm 42:3-5")).toEqual({ read, study });
  });

  it("matches the passage whatever its dash, spacing, or capitals", () => {
    const study = [{ heading: " psalm 42:3 — 5 ", content: "Verse 5." }];

    expect(splitReadingSections([...read, ...study], "Psalm 42:3-5").study).toEqual(study);
  });

  it("keeps everything under Read when no paragraph is headed by the passage", () => {
    expect(splitReadingSections(read, "Psalm 42:3-5")).toEqual({ read, study: [] });
  });

  it("keeps a plan written before headings all under Read", () => {
    const legacy = [
      { heading: null, content: "Read: When disappointment leaves us spiritually thirsty" },
      { heading: null, content: "Psalm 42 opens with longing." },
    ];

    expect(splitReadingSections(legacy, "Psalm 42:1-2")).toEqual({ read: legacy, study: [] });
  });
});
