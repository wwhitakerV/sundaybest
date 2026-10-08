import { previewPassage } from "@/features/settings/logic/text-size-preview";

describe("previewPassage", () => {
  it("is Philippians 4:6 in the Berean Standard Bible", () => {
    expect(previewPassage("BSB")).toEqual({
      reference: "Philippians 4:6",
      translation: "BSB",
      verse: 6,
      text: "Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God.",
    });
  });

  it("is the same verse in the King James Version", () => {
    expect(previewPassage("KJV")).toMatchObject({
      translation: "KJV",
      text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
    });
  });

  it("falls back to the Berean Standard Bible for a translation SundayBest doesn't serve", () => {
    expect(previewPassage("NIV")).toMatchObject({ translation: "BSB" });
  });
});
