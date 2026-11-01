/** Words kept lower inside a title: articles, short conjunctions and prepositions. */
const SMALL_WORDS = new Set(["a", "an", "the", "and", "but", "or", "nor", "of", "to", "in", "on", "at", "by", "for", "as", "vs", "vs."]);
/** Roman numerals, as in "Part II": always upper. */
const ROMAN = /^(?:i{1,3}|iv|vi{0,3}|ix|x{1,3})$/i;
/**
 * Acronyms a sermon title may carry, kept upper. Any other word in capitals
 * is shouting ("BREAK FREE", "YOU"), so it's re-cased: a list, not a guess,
 * because a word in capitals can't tell which it is.
 */
const ACRONYMS = new Set(["NIV", "KJV", "NKJV", "ESV", "NLT", "NASB", "CSB", "BSB", "NRSV", "AMP", "MSG", "TBN", "USA", "UK", "TV", "AI", "DNA", "CEO", "LGBTQ", "MLK", "OK"]);

/**
 * A title in Title Case: every word capitalised but the small ones inside it,
 * each part of a hyphenated word capitalised (Self-Control), apostrophes left
 * alone (God's), Roman numerals upper (Part II), numbers as they are
 * (1 Corinthians 13), and the acronyms in `ACRONYMS` upper; every other word
 * written in capitals is re-cased.
 */
export function titleCase(text: string): string {
  const words = text.trim().split(/\s+/);
  return words.map((word, index) => {
    const bare = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (ROMAN.test(bare) || ACRONYMS.has(bare.toUpperCase())) return word.toUpperCase();
    const lower = word.toLowerCase();
    const inside = index > 0 && index < words.length - 1;
    if (inside && SMALL_WORDS.has(bare.toLowerCase())) return lower;
    return lower.replace(/(^|[-–—/])([^\p{L}\p{N}]*)(\p{L})/gu, (_, separator: string, lead: string, letter: string) => separator + lead + letter.toUpperCase());
  }).join(" ");
}
