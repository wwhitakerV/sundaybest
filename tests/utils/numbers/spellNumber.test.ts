import { spellNumber } from "@/utils/numbers/spellNumber";

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

describe("spellNumber", () => {
  it.each(WORDS.map((word, n) => [n, word] as const))("spells %i as %s", (n, word) => {
    expect(spellNumber(n)).toBe(word);
  });

  it("gives the digits past twenty", () => {
    expect(spellNumber(21)).toBe("21");
    expect(spellNumber(365)).toBe("365");
  });

  it("gives the digits for a negative number, not a word from the end of the list", () => {
    expect(spellNumber(-1)).toBe("-1");
  });

  it("gives the digits for a fraction", () => {
    expect(spellNumber(1.5)).toBe("1.5");
  });
});
