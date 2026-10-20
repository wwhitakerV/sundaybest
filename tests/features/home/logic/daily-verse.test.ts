import {
  describeDailyVerse,
  describeVerseDate,
  describeVerseShare,
  pickDailyVerse,
  verseTranslationFor,
  type DailyVerseDay,
} from "@/features/home/logic/daily-verse";

/** A day of the list, its words the same in both translations unless given. */
function aDay(date: string, overrides: Partial<DailyVerseDay> = {}): DailyVerseDay {
  const verses = [{ number: 13, text: "Bear with each other and forgive one another." }];
  return {
    date,
    caption: "Forgive without pretending the trust was never broken.",
    reference: "Colossians 3:13",
    verses: { BSB: verses, KJV: verses },
    ...overrides,
  };
}

const DAYS = [aDay("2026-10-19"), aDay("2026-10-20"), aDay("2026-10-21")];

describe("pickDailyVerse", () => {
  it("picks the day's own verse", () => {
    expect(pickDailyVerse(DAYS, "2026-10-20")?.date).toBe("2026-10-20");
  });

  it("starts the list again from the top once it has run out", () => {
    expect(pickDailyVerse(DAYS, "2026-10-22")?.date).toBe("2026-10-19");
    expect(pickDailyVerse(DAYS, "2026-10-24")?.date).toBe("2026-10-21");
  });

  it("counts back around the list for a day before it starts", () => {
    expect(pickDailyVerse(DAYS, "2026-10-18")?.date).toBe("2026-10-21");
  });

  it("is nothing with no list", () => {
    expect(pickDailyVerse([], "2026-10-20")).toBeNull();
  });
});

describe("verseTranslationFor", () => {
  it("shows the KJV to a reader who reads it", () => {
    expect(verseTranslationFor("KJV")).toBe("KJV");
  });

  it("shows the BSB to everyone else, the app carrying no other's words", () => {
    expect(verseTranslationFor("BSB")).toBe("BSB");
    expect(verseTranslationFor("NIV")).toBe("BSB");
    expect(verseTranslationFor(undefined)).toBe("BSB");
  });
});

describe("describeDailyVerse", () => {
  it("gives the verse, its reference in the translation it's in, the day's line, and the day", () => {
    expect(describeDailyVerse(aDay("2026-10-19"), "KJV")).toEqual({
      day: "Monday, October 19",
      verse: "Bear with each other and forgive one another.",
      reference: "Colossians 3:13 · KJV",
      passage: "Colossians 3:13",
      caption: "Forgive without pretending the trust was never broken.",
    });
  });

  it("shows a long passage's key verse whole, never cut", () => {
    const long = "A".repeat(150);
    const day = aDay("2026-10-19", {
      reference: "James 5:7-8",
      verses: {
        BSB: [
          { number: 7, text: long },
          { number: 8, text: "You too, be patient." },
        ],
        KJV: [],
      },
    });

    expect(describeDailyVerse(day, "BSB").verse).toBe("You too, be patient.");
  });
});

describe("describeVerseShare", () => {
  it("shares the whole passage in quotes, then its reference and translation", () => {
    const day = aDay("2026-10-19", {
      reference: "James 5:7-8",
      verses: {
        BSB: [
          { number: 7, text: "Be patient, then, brothers." },
          { number: 8, text: "You too, be patient." },
        ],
        KJV: [],
      },
    });

    expect(describeVerseShare(day, "BSB")).toBe(
      "“Be patient, then, brothers. You too, be patient.”\nJames 5:7-8 (BSB)",
    );
  });
});

describe("describeVerseDate", () => {
  it("names the day the verse is for, in full", () => {
    expect(describeVerseDate("2026-10-19")).toBe("Monday, October 19");
  });
});
