import {
  formatCatalogCount,
  formatExamCountInWords,
  formatLevelName,
  formatSubjectNumber,
  formatSubjectPosition,
  getCarouselIndex,
  getFolioGeometry,
  getFolioTier,
} from "@/features/exams/logic/catalog";

const subject = (examCount: number) => ({ exams: Array.from({ length: examCount }) });

describe("formatCatalogCount", () => {
  it("counts the subjects and every exam across them", () => {
    expect(formatCatalogCount([subject(4), subject(4), subject(3)])).toBe("3 subjects · 11 exams");
  });

  it("speaks of one in the singular", () => {
    expect(formatCatalogCount([subject(1)])).toBe("1 subject · 1 exam");
  });
});

describe("formatSubjectPosition", () => {
  it("sets a subject's place among them in two digits", () => {
    expect(formatSubjectPosition(0, 12)).toBe("01 / 12");
    expect(formatSubjectPosition(11, 12)).toBe("12 / 12");
  });
});

describe("formatExamCountInWords", () => {
  it("spells out how many exams a subject holds", () => {
    expect(formatExamCountInWords(4)).toBe("Four exams");
    expect(formatExamCountInWords(1)).toBe("One exam");
  });

  it("falls back to figures past twelve", () => {
    expect(formatExamCountInWords(13)).toBe("13 exams");
  });
});

describe("getCarouselIndex", () => {
  it("finds the page the carousel has come to rest on", () => {
    expect(getCarouselIndex(0, 300, 12)).toBe(0);
    expect(getCarouselIndex(610, 300, 12)).toBe(2);
  });

  it("rounds a page part-way across to the nearer one", () => {
    expect(getCarouselIndex(440, 300, 12)).toBe(1);
    expect(getCarouselIndex(460, 300, 12)).toBe(2);
  });

  it("keeps within the pages there are, overscrolled either way", () => {
    expect(getCarouselIndex(-80, 300, 12)).toBe(0);
    expect(getCarouselIndex(9000, 300, 12)).toBe(11);
  });

  it("stays on the first before the carousel's been measured", () => {
    expect(getCarouselIndex(120, 0, 12)).toBe(0);
  });
});

describe("formatSubjectNumber", () => {
  it("sets a subject's number in two digits, from its index", () => {
    expect(formatSubjectNumber(0)).toBe("01");
    expect(formatSubjectNumber(11)).toBe("12");
  });
});

describe("formatLevelName", () => {
  it("names a level as a word, capitalised", () => {
    expect(formatLevelName("foundations")).toBe("Foundations");
  });
});

describe("getFolioGeometry", () => {
  it("sizes a folio to most of the width, with the next one peeking in", () => {
    const geometry = getFolioGeometry(393);

    expect(geometry.width).toBe(291);
    expect(geometry.interval).toBe(291 + geometry.gap);
    expect(geometry.inset + geometry.width).toBeLessThan(393);
  });

  it("leaves room after the last, so it can come to rest in place", () => {
    const geometry = getFolioGeometry(393);

    expect(geometry.trailing).toBe(393 - geometry.inset - geometry.width);
  });

  it("has no size before it's been measured", () => {
    expect(getFolioGeometry(0)).toMatchObject({ width: 0, interval: 0 });
  });
});

describe("getFolioTier", () => {
  it("sets a book tall enough for its heading and four two-line exams as it's designed", () => {
    expect(getFolioTier(470)).toBe("regular");
    expect(getFolioTier(620)).toBe("regular");
  });

  it("tightens a shorter one — a smaller title, one line an exam — so it still fits", () => {
    expect(getFolioTier(469)).toBe("compact");
    expect(getFolioTier(280)).toBe("compact");
  });
});
