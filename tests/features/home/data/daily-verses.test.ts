import days from "@/features/home/data/daily-verses.json";
// The list as written, which `npm run build:verses` reads.
import list from "../../../../scripts/daily-verses/daily-verses.json";

const dayAfter = (date: string) => {
  const next = new Date(`${date}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
};

describe("the verse of the day's data", () => {
  it("was built from the list as it is now: run npm run build:verses after changing it", () => {
    expect(days.map(({ date, caption, reference }) => ({ date, caption, reference }))).toEqual(
      list.map(({ date, caption, scriptureReference }) => ({
        date,
        caption,
        reference: scriptureReference.split(";")[0]?.trim(),
      })),
    );
  });

  it("has one verse for each day, one after another", () => {
    for (let index = 1; index < days.length; index++) {
      expect(days[index]?.date).toBe(dayAfter(days[index - 1]?.date ?? ""));
    }
  });

  it("has every day's words in both translations it can show", () => {
    for (const day of days) {
      expect(day.verses.BSB.length).toBeGreaterThan(0);
      expect(day.verses.KJV.length).toBeGreaterThan(0);
    }
  });
});
