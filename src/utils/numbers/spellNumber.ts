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
] as const;

/** A count in words, the way a sentence says it: 6 → "six". Past twenty, the digits. */
export function spellNumber(n: number): string {
  return Number.isInteger(n) && n >= 0 ? (WORDS.at(n) ?? String(n)) : String(n);
}
