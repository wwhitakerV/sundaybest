import { getWordsCover } from "@/features/fun/logic/words-cover";

describe("getWordsCover", () => {
  it("leaves the art alone on a card wide enough for its words", () => {
    expect(getWordsCover({ cardWidth: 354, fontScale: 1 })).toBe(0);
    expect(getWordsCover({ cardWidth: 392, fontScale: 1 })).toBe(0);
  });

  it("covers it fully on a card too narrow for them", () => {
    expect(getWordsCover({ cardWidth: 300, fontScale: 1 })).toBe(1);
    expect(getWordsCover({ cardWidth: 260, fontScale: 1 })).toBe(1);
  });

  it("covers it a little more with every point narrower, in between", () => {
    const wide = getWordsCover({ cardWidth: 335, fontScale: 1 });
    const narrow = getWordsCover({ cardWidth: 320, fontScale: 1 });

    expect(wide).toBeGreaterThan(0);
    expect(narrow).toBeGreaterThan(wide);
    expect(narrow).toBeLessThan(1);
  });

  it("counts larger text as a narrower card", () => {
    expect(getWordsCover({ cardWidth: 354, fontScale: 1.3 })).toBe(1);
    expect(getWordsCover({ cardWidth: 354, fontScale: 1.1 })).toBeGreaterThan(0);
  });

  it("leaves it alone before the card's been measured", () => {
    expect(getWordsCover({ cardWidth: 0, fontScale: 1 })).toBe(0);
  });
});
