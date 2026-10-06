import {
  BIBLE_TRANSLATION_CHOICES,
  DEFAULT_BIBLE_TRANSLATION,
} from "@/features/settings/logic/bible-translations";

describe("Bible translation choices", () => {
  it("offers the bundled public-domain translations, BSB first", () => {
    expect(BIBLE_TRANSLATION_CHOICES.map((choice) => choice.value)).toEqual(["BSB", "KJV"]);
  });

  it("names each translation in full", () => {
    expect(BIBLE_TRANSLATION_CHOICES.map((choice) => choice.detail)).toEqual([
      "Berean Standard Bible",
      "King James Version",
    ]);
  });

  it("defaults to BSB, as the server does", () => {
    expect(DEFAULT_BIBLE_TRANSLATION).toBe("BSB");
  });
});
