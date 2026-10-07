import { studyDaySchema } from "@/core/api/contracts";

const ID = "00000000-0000-4000-8000-000000000001";

function studyDay(extra: Record<string, unknown> = {}) {
  return {
    id: ID,
    planId: ID,
    dayNumber: 1,
    reading: {
      title: "Grace is received",
      paragraphs: [{ heading: "Grace First", content: "Read this." }],
      sermonQuote: null,
      sermonClip: null,
    },
    scripture: {
      id: ID,
      reference: "John 3:16",
      book: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: 16,
      translation: "BSB",
      verses: [{ number: 16, text: "Verse text." }],
      cacheAllowed: true,
    },
    reflectionPrompts: [],
    prayer: { id: ID, title: "Prayer", text: "Amen." },
    quickCheckId: null,
    progress: {
      status: "available",
      completedSteps: [],
      scheduledOn: null,
      startedAt: null,
      completedAt: null,
    },
    ...extra,
  };
}

describe("studyDaySchema", () => {
  it("reads a study day saved before supporting Scripture existed as having none", () => {
    expect(studyDaySchema.parse(studyDay()).supportingScriptures).toEqual([]);
  });

  it("keeps supporting Scripture with its connection", () => {
    const supporting = {
      reference: "Romans 5:8",
      book: "Romans",
      chapter: 5,
      verseStart: 8,
      verseEnd: 8,
      connection: "God's love came first.",
      translation: "BSB",
      verses: [{ number: 8, text: "Verse text." }],
    };
    expect(
      studyDaySchema.parse(studyDay({ supportingScriptures: [supporting] })).supportingScriptures,
    ).toEqual([supporting]);
  });

  it("rejects supporting Scripture without a connection", () => {
    const supporting = {
      reference: "Romans 5:8",
      book: "Romans",
      chapter: 5,
      verseStart: 8,
      verseEnd: 8,
      translation: "BSB",
      verses: [{ number: 8, text: "Verse text." }],
    };
    expect(studyDaySchema.safeParse(studyDay({ supportingScriptures: [supporting] })).success).toBe(
      false,
    );
  });
});

describe("a day's reading", () => {
  const reading = (paragraphs: unknown) =>
    studyDaySchema.safeParse(
      studyDay({
        reading: { title: "Grace is received", paragraphs, sermonQuote: null, sermonClip: null },
      }),
    );

  it("takes each paragraph with its heading", () => {
    expect(reading([{ heading: "Grace First", content: "Read this." }]).success).toBe(true);
  });

  it("takes a paragraph from a plan written before headings, with none", () => {
    expect(reading([{ heading: null, content: "Read this." }]).success).toBe(true);
  });

  it("refuses a paragraph that's bare text", () => {
    expect(reading(["Read this."]).success).toBe(false);
  });
});
